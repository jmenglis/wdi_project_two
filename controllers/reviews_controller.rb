class ReviewsController < ApplicationController

  # Displays Top 20 Locations via the spot_by_query.  Ideally want to use long and lat for @client.spot(long, lat, options = {})
  post '/' do
    @client = GooglePlaces::Client.new(ENV["API_KEY"])
    # Takes lat and long variables from frontend and grabs information from Google Places API Gem returns an array of hashes.
    location_info = @client.spots(params[:lat], params[:lng], :type=>'establishment', :exclude=>'neighborhood',:rankby=>'distance')
    # Creating an array of hashes for json to send back to frontend Javascript.
    @all_locations = []
    location_info.each do |item|
      # SQL statement getting Average Rating based on the Place_ID from Google Places
      @average_rating = Location.where(:places_id=>item.place_id).get(:avg_rating) || -1
      # SQL statement getting the count by inner joining reviews table with locations table.
      @the_count =  DB["select count(*) as 'count_rating' from reviews r inner join locations l ON r.location_id = l.location_id where l.places_id = '#{item.place_id}'"].all || 0
      location = {
        "place_name": item.name,
        "lat":        item.lat.to_s,
        "lng":        item.lng.to_s,
        "place_id":   item.place_id,
        "avg_rating": @average_rating,
        "the_count":  @the_count[0][:count_rating]
      }
      @all_locations.push(location)
    end
    @all_locations.to_json
  end


  post '/postreview' do
    if session[:logged_in] === true
      @get_username = User.where(:user_id=>session[:current_user_id]).get(:username)
      @get_location_id = Location.where(:places_id=>params[:place_id]).get(:location_id)
      Review.create  location_id: @get_location_id, rating: params[:stars], who_posted: @get_username
      "Thank you for rating #{@get_username}!"
    else
      "You are not logged in.  Please login"
      erb :login
    end
  end

end
