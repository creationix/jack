// New ideas for a better syntax based on conversation with Zef

// Implementation of if using && short circuting
if := {cond, fn|
  cond! && fn!
}

// function with two block arguments, the ! means to execute
if! {a < 5} { b = true }

// Implementation of while using if
while := {cond fn| // Takes two parameters, the conditon block and the iteration block
  if cond! {
    fn!
    self! cond fn
  }
}

// Count from 1 to 100 using while
i := 1 // decare a new local variable i and set to 1
while! { i <= 100 } {
  print! i
  i = i + 1
}

// Implementation of times using while
// loops i from 1 to n calling (fn i) for each
times := {n fn|
  i := 1
  while! { i <= n } {
    fn! i
    i = i + 1
  }
}

times! 10 print // Print from 1 to 10

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

//

// iterate method that returns an iterator of the list with optional begin and end
it := list.iterate! begin end
while {
  item := it.next!
  print! item
  item
}

// Implement forEach helper
forEach := {it fn|
  item := it.next!
  item != nil && 
    fn! item ||
    self! it fn
  }!
}

// or using generic forEach helper
forEach! list.iterate! {item|
  print! item
}

// Map over a list
map! list.iterate! {item i|
  i, item.name
}