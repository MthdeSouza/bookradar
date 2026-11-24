module Api
  module V1
    class BooksController < ApplicationController
      DEFAULT_PAGE = 1
      DEFAULT_PER_PAGE = 10
      MAX_PER_PAGE = 50

      def search
        validation_error = validate_search_params
        return render_error(validation_error, :bad_request) if validation_error

        result = ::OpenLibrary::SearchService.call(
          query: params[:q].to_s.strip,
          page: page_param,
          per_page: per_page_param
        )

        if result[:success]
          render json: serialized_success(result[:data]), status: :ok
        else
          status = status_for_error(result[:error][:code])
          log_search_failure(result[:error], status)
          render json: { error: safe_error(result[:error]) }, status: status
        end
      end

      private

      def validate_search_params
        q = params[:q]
        return invalid_parameters("O parâmetro 'q' é obrigatório.") if q.nil? || q.to_s.strip.empty?

        page_error = validate_positive_integer_param(:page, params[:page])
        return page_error if page_error

        per_page_error = validate_positive_integer_param(:per_page, params[:per_page], max: MAX_PER_PAGE)
        return per_page_error if per_page_error

        nil
      end

      def validate_positive_integer_param(name, raw_value, max: nil)
        return nil if raw_value.nil? || raw_value.to_s.strip.empty?

        unless raw_value.to_s.match?(/\A\d+\z/)
          return invalid_parameters("O parâmetro '#{name}' deve ser um número inteiro positivo.")
        end

        value = raw_value.to_i
        return invalid_parameters("O parâmetro '#{name}' deve ser maior ou igual a 1.") if value < 1

        if max && value > max
          return invalid_parameters("O parâmetro '#{name}' deve ser menor ou igual a #{max}.")
        end

        nil
      end

      def page_param
        parsed_positive_integer(params[:page], DEFAULT_PAGE)
      end

      def per_page_param
        parsed_positive_integer(params[:per_page], DEFAULT_PER_PAGE)
      end

      def parsed_positive_integer(raw_value, default)
        return default if raw_value.nil? || raw_value.to_s.strip.empty?

        raw_value.to_i
      end

      def serialized_success(data)
        {
          query: data[:query],
          pagination: {
            page: data[:page],
            per_page: data[:per_page],
            total_results: data[:total]
          },
          books: data[:books]
        }
      end

      def invalid_parameters(message)
        { code: "invalid_parameters", message: message }
      end

      def safe_error(error)
        {
          code: error[:code],
          message: error[:message]
        }
      end

      def render_error(error, status)
        render json: { error: safe_error(error) }, status: status
      end

      def status_for_error(code)
        case code
        when "invalid_query", "invalid_parameters"
          :bad_request
        when "timeout"
          :gateway_timeout
        when "connection_error", "unavailable", "invalid_response", "upstream_error"
          :bad_gateway
        else
          :bad_gateway
        end
      end

      def log_search_failure(error, status)
        return unless defined?(Rails) && Rails.respond_to?(:logger) && Rails.logger

        Rails.logger.info(
          "[BooksController#search] failure code=#{error[:code]} status=#{Rack::Utils.status_code(status)}"
        )
      rescue StandardError
        # Evita que falhas de log afetem a resposta.
      end
    end
  end
end