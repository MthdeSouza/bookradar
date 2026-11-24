require "test_helper"

module OpenLibrary
  class SearchServiceTest < ActiveSupport::TestCase
    FakeResponse = Struct.new(:code, :body)

    test "retorna erro para termo vazio sem consultar API externa" do
      called = false
      with_http_stub(lambda { |*_args, **_kwargs|
        called = true
        raise "não deveria chamar HTTP"
      }) do
        result = OpenLibrary::SearchService.call(query: "   ")
        assert_not result[:success]
        assert_equal "invalid_query", result[:error][:code]
      end
      assert_not called
    end

    test "normaliza resposta válida da Open Library" do
      body = {
        numFound: 42,
        docs: [
          {
            "key" => "/works/OL1W",
            "title" => "Livro Teste",
            "author_name" => ["Autora A", nil, "Autor B"],
            "first_publish_year" => 1999,
            "cover_i" => 123,
            "edition_count" => 7
          }
        ]
      }.to_json

      with_http_stub(success_stub(body)) do
        result = OpenLibrary::SearchService.call(query: "harry potter", page: 2, per_page: 5)

        assert result[:success]
        assert_equal "harry potter", result[:data][:query]
        assert_equal 2, result[:data][:page]
        assert_equal 5, result[:data][:per_page]
        assert_equal 42, result[:data][:total]
        assert_equal 1, result[:data][:books].size

        book = result[:data][:books].first
        assert_equal "/works/OL1W", book[:key]
        assert_equal "Livro Teste", book[:title]
        assert_equal ["Autora A", "Autor B"], book[:authors]
        assert_equal 1999, book[:first_publish_year]
        assert_equal 123, book[:cover_id]
        assert_equal "https://covers.openlibrary.org/b/id/123-M.jpg", book[:cover_url]
        assert_equal 7, book[:edition_count]
      end
    end

    test "trata timeout da API externa" do
      with_http_stub(lambda { |*_args, **_kwargs| raise Net::ReadTimeout }) do
        result = OpenLibrary::SearchService.call(query: "ruby")
        assert_not result[:success]
        assert_equal "timeout", result[:error][:code]
      end
    end

    test "trata falha de conexão com a API externa" do
      with_http_stub(lambda { |*_args, **_kwargs| raise SocketError, "falha" }) do
        result = OpenLibrary::SearchService.call(query: "ruby")
        assert_not result[:success]
        assert_equal "connection_error", result[:error][:code]
      end
    end

    test "trata resposta inválida (JSON malformado)" do
      with_http_stub(success_stub("{invalid-json")) do
        result = OpenLibrary::SearchService.call(query: "ruby")
        assert_not result[:success]
        assert_equal "invalid_response", result[:error][:code]
      end
    end

    test "trata resposta inválida quando docs não é array" do
      with_http_stub(success_stub({ numFound: 1, docs: {} }.to_json)) do
        result = OpenLibrary::SearchService.call(query: "ruby")
        assert_not result[:success]
        assert_equal "invalid_response", result[:error][:code]
      end
    end

    test "trata indisponibilidade da API externa em erros 5xx" do
      with_http_stub(lambda { |*_args, **_kwargs| FakeResponse.new("503", "") }) do
        result = OpenLibrary::SearchService.call(query: "ruby")
        assert_not result[:success]
        assert_equal "unavailable", result[:error][:code]
      end
    end

    private

    def success_stub(body)
      lambda { |*_args, **_kwargs| FakeResponse.new("200", body) }
    end

    def with_http_stub(behavior)
      original = Net::HTTP.method(:start)
      Net::HTTP.define_singleton_method(:start) do |*args, **kwargs, &block|
        response = behavior.call(*args, **kwargs)
        http = Object.new
        http.define_singleton_method(:request) { |_req| response }
        block ? block.call(http) : response
      end
      yield
    ensure
      Net::HTTP.singleton_class.send(:define_method, :start) do |*args, **kwargs, &block|
        original.call(*args, **kwargs, &block)
      end
    end
  end
end
