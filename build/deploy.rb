#!/usr/bin/env ruby

puts `build/sass.rb`
puts `build/sitemap.rb`
puts `build/haml.rb`
File.rename '.deploy.gitignore', '.gitignore'
