def glob(pattern, *args, **kwargs, &block)
  # GitHub actions creates a folder named vendor as part of the install process, which should be removed here

  all_results = Dir.glob(pattern, *args, **kwargs)
  all_results.reject! {|file| file.start_with? 'vendor/'}
  if block_given?
    all_results.each(&block)
  else
    all_results
  end
end
