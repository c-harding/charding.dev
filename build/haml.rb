#!/usr/bin/env ruby
require 'haml'

class Page
  def initialize(haml, output)
    @regions = {}
    @overwritten_regions = []
    @unused_regions = []
    @output = output
    @content = Haml::Engine.new(haml).render(self)
  end

  def content_for(region, &blk)
    @overwritten_regions << region if @regions.key? region
    @regions[region] = capture_haml(&blk)
    @unused_regions << region
  end

  def [](region)
    @unused_regions.delete region
    @regions[region]
  end

  def path
    @output.sub(/(^|\/)index\.html$/, '\1')
  end

  def parent
    path.sub(/[^\/]*\/?$/, "")
  end

  def link_to(url, classes=[])
    if url == "/"
      return {href: url, class: [("this" if "/#{path}" == "/")] + classes}
    else
      return {href: url, class: [("this" if "/#{path}".start_with? url)] + classes}
    end
  end

  def to_html(template)
    begin
      html = template.render self do |region|
        region.nil? ? @content : self[region]
      end
    rescue NameError => e
      raise e
      raise NameError.new("File #{@output} contains a reference to the unknown variable #{e.name}.", e.name)
    end
    unless @overwritten_regions.empty?
      STDERR.puts "The following regions were overwritten: #{@overwritten_regions.join ", "}"
    end
    unless @unused_regions.empty?
      STDERR.puts "The following regions were never used: #{@unused_regions.join ", "}"
    end
    html
  end
end

template_path = "template.haml"
template = Haml::Engine.new(File.read("template.haml"))

Dir['**/*.haml'].each do |input|
  next if input == template_path
  begin
    output = input.sub(/\.haml$/, ".html")

    page = Page.new(File.read(input), output).to_html(template)
    
    File.open(output, 'w') {|f| f.write page}

    puts "File '#{output}' written successfully"
  rescue => error
    STDERR.puts "Cannot process #{input}"

    STDERR.puts error.backtrace if $DEBUG

    if error.to_s.match? /To use the "maruku" filter/
      STDERR.puts <<~ERROR
        To use the Maruku filter, you need to install the haml-contrib and maruku gems:
        
          gem install haml-contrib maruku
        
      ERROR
      exit 1
    else
      STDERR.puts $!
    end
  end
end
