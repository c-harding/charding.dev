#!/usr/bin/env ruby

system('build/css.rb', exception: true)
system('build/html.rb', exception: true)
