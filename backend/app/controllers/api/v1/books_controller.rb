module Api
  module V1
    class BooksController < ApplicationController
      def search
        result = OpenLibrary::SearchService.call(
          query: params[:q],
          page: params[:page],
          per_page: params[:per_page]
        )

        if result[:success]
          render json: result[:data], status: :ok
        else
          render json: { error: result[:error] }, status: status_for_error(result[:error][:code])
        end
      end

      private

      def status_for_error(code)
        case code
        when "invalid_query"
          :bad_request
        when "timeout"
          :gateway_timeout
        when "connection_error", "unavailable"
          :bad_gateway
        when "invalid_response", "upstream_error"
          :bad_gateway
        else
          :bad_gateway
        end
      end
    end
  end
end