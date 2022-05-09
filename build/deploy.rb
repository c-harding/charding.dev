#!/usr/bin/env ruby

system('build/sitemap.rb', exception: true)
system('build/build.rb', exception: true)
