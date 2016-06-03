# config valid only for Capistrano 3.1
lock '3.2.1'

set :application, 'new-bg'
set :repo_url, 'git@bitbucket.org:billingrad/new-bg.git'

# Default branch is :master
# ask :branch, proc { `git rev-parse --abbrev-ref HEAD`.chomp }.call

# Default deploy_to directory is /var/www/my_app
set :deploy_to, '/www/new-bg/master'

# Default value for :scm is :git
set :scm, :git

# Default value for :format is :pretty
# set :format, :pretty

# Default value for :log_level is :debug
# set :log_level, :debug

# Default value for :pty is false
# set :pty, true

# Default value for :linked_files is []
# set :linked_files, %w{config/database.yml}
#set :linked_files, %w{ data.cfg }
# Default value for linked_dirs is []
# set :linked_dirs, %w{bin log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system}

# Default value for default_env is {}
# set :default_env, { path: "/opt/ruby/bin:$PATH" }

# Default value for keep_releases is 5
set :keep_releases, 10

# grunt local compilation
      run_locally do
			  execute "grunt"
			end


namespace :deploy do
  desc 'assets compilation'
  task :gruntupload do
    on roles(:app, :web) do
      rsync_host = host.to_s
      run_locally do
        # разобраться, пока костыль execute "rsync -av ./public/assets/ #{fetch(:user)}@#{rsync_host}:#{shared_path}/public/assets/"
        execute "rsync -av ./public/bg.min.js root@#{rsync_host}:#{current_path}/public/"
      end
    end
  end
  after :publishing, :gruntupload

  desc 'npm install'
  task :npm_install do
    on roles(:app), in: :sequence do
      execute "cd #{release_path} && npm install 2>/dev/null >/dev/null"
    end
  end

   
  desc 'write app config'
  task :write_app_config do
    on roles(:app), in: :sequence do
      
      postgres_host = fetch(:postgres_host)
      postgres_user = fetch(:postgres_user)
      postgres_password = fetch(:postgres_password)
      postgres_database = fetch(:postgres_database)
      
      couch_host = fetch(:couch_host)
      couch_port = fetch(:couch_port)

      rabbit_host = fetch(:rabbit_host)
      rabbit_port = fetch(:rabbit_port)

      redis_host = fetch(:redis_host)
      redis_port = fetch(:redis_port)

      email_user = fetch(:email_user)
      email_password = fetch(:email_password)
      email_host = fetch(:email_host)
      email_ssl = fetch(:email_ssl)
      email_tls = fetch(:email_tls)

      config = <<-CONFIG
postgres.host=#{postgres_host}
postgres.user=#{postgres_user}
postgres.password=#{postgres_password}
postgres.database=#{postgres_database}
couch.host=#{couch_host}:#{couch_port}
rabbit.host=#{rabbit_host}
rabbit.port=#{rabbit_port}
email.user=#{email_user}
email.password=#{email_password}
email.host=#{email_host}
email.ssl=#{email_ssl}
email.tls=#{email_tls}
redis.host=#{redis_host}
redis.port=#{redis_port}
CONFIG
      location = 'data.cfg'
      File.open(location,'w+') {|f| f.write config }
      upload! "#{location}", "#{shared_path}/data.cfg"
			execute "cd #{release_path} && ln -sf #{shared_path}/data.cfg"
    end
  end
  after :publishing, :npm_install

  after :npm_install, :write_app_config

  
  desc 'update config'
  task :update_config do
    on roles(:app), in: :sequence do
      execute "cd #{release_path} && python shrew.py cfg.cfg ./"
    end
  end
  
  after :write_app_config, :update_config

  desc 'Restart application'
  task :restart do
    on roles(:app), in: :sequence, wait: 5 do
      execute "sv restart /etc/service/node-billingrad"
    end
  end

  after :publishing, :restart

  after :restart, :clear_cache do
    on roles(:web), in: :groups, limit: 3, wait: 10 do
      # Here we can do anything such as:
      # within release_path do
      #   execute :rake, 'cache:clear'
      # end
    end
  end

end
