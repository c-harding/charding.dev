#!/usr/bin/env ruby

puts `build/sitemap.rb`
puts `build/build.rb`
File.rename '.deploy.gitignore', '.gitignore'
