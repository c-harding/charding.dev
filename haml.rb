#!/usr/bin/env ruby
require 'haml'

class Regions  
  def initialize
    @regions_hash={}
  end

  def content_for(region, &blk)  
    @regions_hash[region] = capture_haml(&blk)
  end

  def [](region)
    @regions_hash[region]
  end
end

Dir['**/index.haml'].each do |input|
  begin
    dir = input.sub(/index\.haml$/, "")
    output = "#{dir}index.html"
    regions = Regions.new
    file = Haml::Engine.new(File.read(input)).render(regions)
    rendered = Haml::Engine.new(File.read("template.haml")).render Object.new, f: dir do |region|
      region ? regions[region] : file
    end
    
    File.open(output, 'w') {|f| f.write rendered}

    puts "File '#{output}' written successfully"
  rescue
    puts "Directory '#{dir}' not processed."
    puts $!
    puts $!.backtrace if $DEBUG
  end
end
