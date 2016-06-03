# Simple Role Syntax
# ==================
# Supports bulk-adding hosts to roles, the primary server in each group
# is considered to be the first unless any hosts have the primary
# property set.  Don't declare `role :all`, it's a meta role.

set :deploy_to, '/www/new-bg/develop'
set :branch, ENV['BRANCH'] || 'develop'
role :app, %w{root@144.76.253.170}
##role :web, %w{deploy@example.com}
##role :db,  %w{deploy@example.com}

set :postgres_host, 'localhost'
set :postgres_user, 'z'
set :postgres_password, 'z'
set :postgres_database, 'contact'

set :couch_host, 'localhost'
set :couch_port, '5984'

set :rabbit_host, 'localhost'
set :rabbit_port, '5672'

set :email_user, ''
set :email_password, ''
set :email_host, 'localhost'
set :email_ssl, 'false'
set :email_tls, 'false'


# Extended Server Syntax
# ======================
# This can be used to drop a more detailed server definition into the
# server list. The second argument is a, or duck-types, Hash and is
# used to set extended properties on the server.

##server '192.168.100.199', user: 'root', roles: %w{web app}, my_property: :my_value


# Custom SSH Options
# ==================
# You may pass any option but keep in mind that net/ssh understands a
# limited set of options, consult[net/ssh documentation](http://net-ssh.github.io/net-ssh/classes/Net/SSH.html#method-c-start).
#
# Global options
# --------------
#  set :ssh_options, {
#    keys: %w(/home/rlisowski/.ssh/id_rsa),
#    forward_agent: false,
#    auth_methods: %w(password)
#  }
#
# And/or per server (overrides global)
# ------------------------------------
# server 'example.com',
#   user: 'user_name',
#   roles: %w{web app},
#   ssh_options: {
#     user: 'user_name', # overrides user setting above
#     keys: %w(/home/user_name/.ssh/id_rsa),
#     forward_agent: false,
#     auth_methods: %w(publickey password)
#     # password: 'please use keys'
#   }
