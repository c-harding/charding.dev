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

regions = Regions.new

[
  "",
  "projects/",
  "projects/CSSpro/",
  "projects/dungeon/",
  "projects/jsCSS/",
  "projects/jsCSS/"
].each do |f|
  begin
    file = Haml::Engine.new(File.read("#{f}index.haml")).render(regions)
    rendered = Haml::Engine.new(File.read("template.haml")).render false, f: f do |region|
      region ? regions[region] : file
    end
    
    File.open("#{f}index.html", 'w') {|file| file.write rendered}
  rescue
    
  end
end
