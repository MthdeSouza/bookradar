class Api::V1::HealthController < ApplicationController
  def show
    render json: {
      application: "BookRadar",
      status: "online",
      version: "1.0.0"
    }
  end
end