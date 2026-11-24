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
    CACHE_TTL = 15.minutes
    USER_AGENT = "BookRadar/1.0 (+https://github.com/MthdeSouza/bookradar)"

    def initialize(query:, page: DEFAULT_PAGE, per_page: DEFAULT_PER_PAGE)
      @query = query.to_s.strip
      @page = normalize_positive_integer(page, DEFAULT_PAGE)
      @per_page = normalize_positive_integer(per_page, DEFAULT_PER_PAGE, MAX_PER_PAGE)
    end

    def call
      return invalid_query_result if @query.empty?

      cached = Rails.cache.read(cache_key)
      return cached if cached.is_a?(Hash) && cached[:success]

      result = fetch_and_parse
      Rails.cache.write(cache_key, result, expires_in: CACHE_TTL) if result[:success]
      result
    rescue JSON::ParserError => e
      failure("invalid_response", "Resposta inválida recebida da Open Library.", exception: e)
    rescue Net::OpenTimeout, Net::ReadTimeout, Timeout::Error => e
      failure("timeout", "Tempo limite excedido ao consultar a Open Library.", exception: e)
    rescue SocketError, Errno::ECONNREFUSED, Errno::EHOSTUNREACH, Errno::ENETUNREACH, OpenSSL::SSL::SSLError => e
      failure("connection_error", "Não foi possível conectar à Open Library.", exception: e)
    rescue StandardError => e
      failure("unavailable", "A Open Library está indisponível no momento.", exception: e)
    end

    def self.call(query:, page: DEFAULT_PAGE, per_page: DEFAULT_PER_PAGE)
      new(query: query, page: page, per_page: per_page).call
    end

    private

    def fetch_and_parse
      response = perform_request
      return response unless response[:success]

      parse_response(response[:body])
    end

    def cache_key
      normalized_query = @query.downcase.squish
      "open_library:search:v1:q=#{normalized_query}:page=#{@page}:per_page=#{@per_page}"
    end

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
        failure("unavailable", "A Open Library está indisponível no momento.", upstream_status: code)
      else
        failure("upstream_error", "Não foi possível obter resultados da Open Library.", upstream_status: code)
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

    def failure(code, message, upstream_status: nil, exception: nil)
      log_failure(code, exception, upstream_status: upstream_status) if loggable_failure?(code)
      {
        success: false,
        error: {
          code: code,
          message: message
        }
      }
    end

    def loggable_failure?(code)
      %w[invalid_response timeout connection_error unavailable upstream_error].include?(code)
    end

    def log_failure(code, exception = nil, upstream_status: nil)
      return unless defined?(Rails) && Rails.respond_to?(:logger) && Rails.logger

      details = {
        service: "OpenLibrary::SearchService",
        code: code,
        page: @page,
        per_page: @per_page
      }
      details[:upstream_status] = upstream_status if upstream_status
      details[:exception] = exception.class.name if exception

      Rails.logger.warn("[OpenLibrary::SearchService] #{details.map { |k, v| "#{k}=#{v}" }.join(' ')}")
    rescue StandardError
      # Evita que falhas de log afetem o fluxo principal.
    end
  end
end