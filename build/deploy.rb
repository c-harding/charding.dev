#!/usr/bin/env ruby

puts `build/sass.rb`
puts `build/haml.rb`
puts `build/sitemap.rb`
File.rename '.deploy.gitignore', '.gitignore'
