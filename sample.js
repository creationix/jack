// Create a map representing a person
tim = {
  name: "Tim",
  age: 30
}
// Implement a set using the map as the key in this map
team = {
  [tim]: true
}

// Or written in long-form
tim = {}
tim["name"] = "Tim"
tim["age"] = 30
team = {}
team[tim] = true

// Or in one expression without temporary variables
{[{name: "Tim", age: 30}]: true}

// Count down from 100 to 1
{|i|
  print(i)
  i > 0 and proto(i - 1)
}(100)

// Abstracted as a countDown function
countDown = { |i, fn|
  fn(i)
  i > 0 and proto(i - 1)
}
countDown(100, print)

// Rectangle Class
Rect = {|w, h|
  area = {
    w * h
  }
  this
}

r = Rect(3, 4)
print(r.area())