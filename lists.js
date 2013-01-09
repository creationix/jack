// lists are simply comma seperated values
list := 1, 2, 3, 4

// lists act like maps in syntax
// There is a "length" method that is the number of items in the list
print! list.length! // -> 4

// Items can be retrieved using integer indexes
print! list[0] // -> 1
// invalid keys throw errors
print! list[-1] // ERROR invalid index -1
// key at length is nil
print! list[4] // -> nil

// more methods to manipulate lists
list.push! 5
print! list.pop! // -> 5
print! list.shift! // -> 1
list.unshift! 1
list.splice! 2 0 false, true // Insert false, true at index 2
list.splice! 2 2 // remove false, true from list
list.slice! begin  end // -> a new list from begin to end
