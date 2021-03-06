class UsersController < ApplicationController

  # Register User Method to be called in our '/register' route.
  def register_user
    @user_count = DB["select count(*) as usercount from users where lower(username) like lower('#{params[:username]}')"].all
    if @user_count[0][:usercount] == 0
      password = BCrypt::Password.create(params[:password])
      @new_user = User.create username: params[:username], email: params[:email], password: password
      session[:logged_in] = true
      session[:current_user_id] = @new_user[:user_id]
    else
      $message = "This user already exists.  Please login or register with a different username"
      redirect "/users"
    end
  end

  # Login user method to be called in our '/login' route
  def login_user
    user = DB["select * from users where lower(username) like lower('#{params[:username]}')"].all
    if !user[0]
      $message = "Username does not exist"
      redirect '/users'
    elsif user && BCrypt::Password.new(user[0][:password]) == params[:password]
      session[:logged_in] = true
      session[:current_user_id] = user[0][:user_id]
    else
      $message = "You have entered an incorrect username or password.  Please try again."
      redirect '/users'
    end
  end

  # Login/Registration Page
  # default for get for Login Page
  get '/' do
    erb :login
  end

  # Registration Post Route
  # Form Names from Params: username, email, password
  post '/register' do
    register_user
    # Checks to see if user is coming from '/postreview' route and has stored session info.
    if session[:stars] && session[:place_id]
      post_review(session[:stars], session[:place_id])
      session.delete(:stars)
      session.delete(:place_id)
      $message = "Thanks for creating your account!  Your review has been posted."
      erb :main
    # Normal Registration
    elsif !session[:stars] && !session[:place_id]
      $message = "Thanks for creating your account!"
      erb :main
    else
      $message = "You are already logged in."
      erb :main
    end
  end

  # Login Post Route
  # Form Name from Params: username, password
  post '/login' do
    # Checks to see if user is coming from '/postreview' and has stored session info.
    login_user
    if session[:stars] && session[:place_id]
      post_review(session[:stars], session[:place_id])
      session.delete(:stars)
      session.delete(:place_id)
      $message = "You are now logged in and your review has been posted."
      erb :main
    # Normal login
    elsif !session[:stars] && !session[:place_id]
      $message = "You are now logged in."
      erb :main
    else
      $message = "You are already logged in."
      erb :main
    end
  end

  # Logout Get Route
  # Deletes all stored session information
  get '/logout' do
    session.delete(:logged_in)
    session.delete(:current_users_id)
    session.delete(:stars)
    session.delete(:place_id)
    $message = "You have been logged out"
    erb :main
  end
end
