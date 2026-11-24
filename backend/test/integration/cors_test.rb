require "test_helper"

class CorsTest < ActionDispatch::IntegrationTest
  test "permite a origem padrão de desenvolvimento" do
    get "/api/v1/health", headers: { "Origin" => "http://localhost:5173" }

    assert_response :success
    assert_equal "http://localhost:5173", response.headers["Access-Control-Allow-Origin"]
  end

  test "não libera origens desconhecidas" do
    get "/api/v1/health", headers: { "Origin" => "https://site-desconhecido.example" }

    assert_response :success
    assert_nil response.headers["Access-Control-Allow-Origin"]
  end

  test "responde ao preflight OPTIONS da busca" do
    options "/api/v1/books/search", headers: {
      "Origin" => "http://localhost:5173",
      "Access-Control-Request-Method" => "GET"
    }

    assert_response :success
    assert_equal "http://localhost:5173", response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Allow-Methods"], "GET"
  end
end
