require "test_helper"

class Api::V1::BooksControllerTest < ActionDispatch::IntegrationTest
  test "retorna resultados padronizados com paginação" do
    service_data = {
      query: "harry",
      page: 2,
      per_page: 5,
      total: 12,
      books: [
        {
          key: "/works/OL1W",
          title: "Livro",
          authors: ["Autor"],
          first_publish_year: 2001,
          cover_id: 10,
          cover_url: "https://covers.openlibrary.org/b/id/10-M.jpg",
          edition_count: 3
        }
      ]
    }

    with_service_stub({ success: true, data: service_data }) do
      get "/api/v1/books/search", params: { q: "harry", page: 2, per_page: 5 }

      assert_response :success
      body = JSON.parse(response.body)
      assert_equal "harry", body["query"]
      assert_equal({ "page" => 2, "per_page" => 5, "total_results" => 12 }, body["pagination"])
      assert_equal 1, body["books"].size
      assert_equal "/works/OL1W", body["books"][0]["key"]
    end
  end

  test "retorna erro para parâmetros inválidos sem termo" do
    get "/api/v1/books/search"
    assert_response :bad_request
    body = JSON.parse(response.body)
    assert_equal "invalid_parameters", body.dig("error", "code")
  end

  test "retorna erro para página inválida" do
    get "/api/v1/books/search", params: { q: "harry", page: 0 }
    assert_response :bad_request
    assert_equal "invalid_parameters", JSON.parse(response.body).dig("error", "code")
  end

  test "retorna erro para per_page inválido" do
    get "/api/v1/books/search", params: { q: "harry", per_page: "abc" }
    assert_response :bad_request
    assert_equal "invalid_parameters", JSON.parse(response.body).dig("error", "code")
  end

  test "retorna erro para per_page acima do máximo" do
    get "/api/v1/books/search", params: { q: "harry", per_page: 51 }
    assert_response :bad_request
    assert_equal "invalid_parameters", JSON.parse(response.body).dig("error", "code")
  end

  test "mapeia timeout do serviço para gateway timeout" do
    with_service_stub({ success: false, error: { code: "timeout", message: "Tempo limite excedido ao consultar a Open Library." } }) do
      get "/api/v1/books/search", params: { q: "harry" }
      assert_response :gateway_timeout
      body = JSON.parse(response.body)
      assert_equal "timeout", body.dig("error", "code")
    end
  end

  test "mapeia falha externa do serviço para bad gateway" do
    with_service_stub({ success: false, error: { code: "unavailable", message: "A Open Library está indisponível no momento." } }) do
      get "/api/v1/books/search", params: { q: "harry" }
      assert_response :bad_gateway
      body = JSON.parse(response.body)
      assert_equal "unavailable", body.dig("error", "code")
    end
  end

  private

  def with_service_stub(result)
    original = ::OpenLibrary::SearchService.method(:call)
    ::OpenLibrary::SearchService.define_singleton_method(:call) { |**_args| result }
    yield
  ensure
    ::OpenLibrary::SearchService.singleton_class.send(:define_method, :call) do |**args|
      original.call(**args)
    end
  end
end
