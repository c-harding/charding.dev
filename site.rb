require 'yaml'
require 'haml'
require 'uri'

def listing(link=nil, &block)
  src_folder = File.join(File.dirname(__FILE__), 'src')
  link = File.join(link,'') unless link.nil?
  if link&.start_with? "/"
    folder = File.join(src_folder, link)
  else
    current_path = File.directory?(File.join(src_folder, path)) ? path : File.dirname(path)
    folder = File.join(src_folder, current_path, link || '')
  end

  items = YAML.load_file(File.join(folder, "listing.yml"))
  hide_link = link.nil? || Dir.glob(File.join(folder, "index.html.*")).empty?
  if hide_link
    filtered_items = items
  else
    filtered_items = items.filter {|item| item['homepage']}
    hide_link ||= filtered_items.size == items.size
  end

  context = Object.new
  context.define_singleton_method :relative_url, lambda { |url|
    URI(url).relative? && link ? File.join(link, url) : url
  }

  haml = <<~HAML
    %ul.listing
      - items.each do |item|
        %li
          %a{href: relative_url(item['url'])}= item['name']
          —
          = item['desc']
      - unless hide_link
        %li
          %a{href: link} See all…
  HAML
  Haml::Engine.new(haml).to_html context, items: filtered_items, hide_link: hide_link, link: link
end
