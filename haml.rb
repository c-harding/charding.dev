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

[
  "",
  "projects/",
  "projects/CSSpro/",
  "projects/dungeon/",
  "projects/jsCSS/",
  "projects/styleCSS/",
  "designs/ah/",
].each do |f|
  begin
    regions = Regions.new
    file = Haml::Engine.new(File.read("#{f}index.haml")).render(regions)
    rendered = Haml::Engine.new(File.read("template.haml")).render false, f: f do |region|
      region ? regions[region] : file
    end
    
    File.open("#{f}index.html", 'w') {|file| file.write rendered}

    puts "File '#{f}' written successfully"
  rescue
    puts "File '#{f}index.haml' not read."
    #puts $!, $@
  end
end
