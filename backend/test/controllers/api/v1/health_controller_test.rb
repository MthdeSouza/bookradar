require "test_helper"

class Api::V1::HealthControllerTest < ActionDispatch::IntegrationTest
  test "retorna o status da aplicação" do
    get "/api/v1/health"

    assert_response :success
    body = JSON.parse(response.body)
    assert_equal "BookRadar", body["application"]
    assert_equal "online", body["status"]
  end
end
