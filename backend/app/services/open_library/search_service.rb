# frozen_string_literal: true

require "json"
require "net/http"
require "uri"

module OpenLibrary
  class SearchService
    BASE_URL = "https://openlibrary.org/search.json"
    REQUEST_FIELDS = %w[key title author_name first_publish_year cover_i edition_count].freeze
    DEFAULT_PAGE = 1
    DEFAULT_PER_PAGE = 10
    MAX_PER_PAGE = 50
    OPEN_TIMEOUT = 5
    READ_TIMEOUT = 10
    USER_AGENT = "BookRadar/1.0 (+https://github.com/MthdeSouza/bookradar)"

    def initialize(query:, page: DEFAULT_PAGE, per_page: DEFAULT_PER_PAGE)
      @query = query.to_s.strip
      @page = normalize_positive_integer(page, DEFAULT_PAGE)
      @per_page = normalize_positive_integer(per_page, DEFAULT_PER_PAGE, MAX_PER_PAGE)
    end

    def call
      return invalid_query_result if @query.empty?

      response = perform_request
      return response unless response[:success]

      parse_response(response[:body])
    rescue JSON::ParserError
      failure("invalid_response", "Resposta inválida recebida da Open Library.")
    rescue Net::OpenTimeout, Net::ReadTimeout, Timeout::Error
      failure("timeout", "Tempo limite excedido ao consultar a Open Library.")
    rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Errno::ENETUNREACH, OpenSSL::SSL::SSLError
      failure("connection_error", "Não foi possível conectar à Open Library.")
    rescue StandardError
      failure("unavailable", "A Open Library está indisponível no momento.")
    end

    def self.call(query:, page: DEFAULT_PAGE, per_page: DEFAULT_PER_PAGE)
      new(query: query, page: page, per_page: per_page).call
    end

    private

    def normalize_positive_integer(value, default, max = nil)
      number = Integer(value, exception: false)
      number = default if number.nil? || number < 1
      number = max if max && number > max
      number
    end

    def invalid_query_result
      failure("invalid_query", "Informe um termo de pesquisa válido.")
    end

    def perform_request
      uri = build_uri
      request = Net::HTTP::Get.new(uri)
      request["User-Agent"] = USER_AGENT
      request["Accept"] = "application/json"

      response = Net::HTTP.start(uri.host, uri.port, use_ssl: uri.scheme == "https", open_timeout: OPEN_TIMEOUT, read_timeout: READ_TIMEOUT) do |http|
        http.request(request)
      end

      handle_http_response(response)
    end

    def build_uri
      uri = URI(BASE_URL)
      uri.query = URI.encode_www_form(
        q: @query,
        page: @page,
        limit: @per_page,
        fields: REQUEST_FIELDS.join(",")
      )
      uri
    end

    def handle_http_response(response)
      code = response.code.to_i

      if code >= 200 && code < 300
        { success: true, body: response.body }
      elsif code >= 500 || code == 429
        failure("unavailable", "A Open Library está indisponível no momento.")
      else
        failure("upstream_error", "Não foi possível obter resultados da Open Library.")
      end
    end

    def parse_response(body)
      payload = JSON.parse(body)
      docs = payload["docs"]

      return failure("invalid_response", "Resposta inválida recebida da Open Library.") unless docs.is_a?(Array)

      {
        success: true,
        data: {
          query: @query,
          page: @page,
          per_page: @per_page,
          total: payload["numFound"].to_i,
          books: docs.map { |doc| normalize_book(doc) }
        }
      }
    end

    def normalize_book(doc)
      cover_id = doc["cover_i"]
      {
        key: doc["key"],
        title: doc["title"],
        authors: Array(doc["author_name"]).compact,
        first_publish_year: doc["first_publish_year"],
        cover_id: cover_id,
        cover_url: cover_url_for(cover_id),
        edition_count: doc["edition_count"]
      }
    end

    def cover_url_for(cover_id)
      return nil if cover_id.nil?

      "https://covers.openlibrary.org/b/id/#{cover_id}-M.jpg"
    end

    def failure(code, message)
      {
        success: false,
        error: {
          code: code,
          message: message
        }
      }
    end
  end
end