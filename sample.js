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
  if i > 0 bind(self, i - 1)
}(100)
