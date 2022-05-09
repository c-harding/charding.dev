#!/usr/bin/env ruby

puts %x(
  build/css.rb &&
  build/html.rb
)
