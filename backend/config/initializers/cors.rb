# Be sure to restart your server when you modify this file.

# Permite que o frontend (hospedado em outra origem) consuma a API.
# FRONTEND_ORIGIN aceita uma ou mais origens separadas por vírgula, por exemplo:
#   FRONTEND_ORIGIN=https://bookradar.vercel.app
# Sem a variável, assume o servidor de desenvolvimento do Vite.
#
# Read more: https://github.com/cyu/rack-cors

default_frontend_origin = "http://localhost:5173"

allowed_origins = ENV.fetch("FRONTEND_ORIGIN", "").split(",").filter_map do |origin|
  origin.strip.chomp("/").presence
end
allowed_origins = [ default_frontend_origin ] if allowed_origins.empty?

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*allowed_origins)

    resource "*",
      headers: :any,
      methods: [ :get, :head, :options ],
      max_age: 86_400
  end
end
