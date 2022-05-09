require 'digest'

def write_if_changed(file, output, log: false)
  previous_digest = Digest::SHA256.file(file).digest
  new_digest = Digest::SHA256.digest(output)
  File.write(file, output)
  if previous_digest == new_digest
    puts "Unchanged:     #{file}" if log
    return false
  else
    puts "Changes saved: #{file}" if log
    return true
  end
end
