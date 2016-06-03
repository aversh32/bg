# Simple Role Syntax
# ==================
# Supports bulk-adding hosts to roles, the primary server in each group
# is considered to be the first unless any hosts have the primary
# property set.  Don't declare `role :all`, it's a meta role.

role :app, %w{root@192.168.100.41 root@192.168.100.42}
role :web, %w{root@192.168.100.31 root@192.168.100.32}
##role :db,  %w{deploy@example.com}

set :postgres_host, '192.168.150.2'
set :postgres_user, 'production'
set :postgres_password, 'ieTh2queeshiegho'
set :postgres_database, 'contact'

set :couch_host, '192.168.150.5'
set :couch_port, '5984'

set :rabbit_host, '192.168.150.8'
set :rabbit_port, '5672'

set :redis_host, '192.168.150.11'
set :redis_port, '6379'

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

##server 'example.com', user: 'deploy', roles: %w{web app}, my_property: :my_value


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
