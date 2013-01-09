// New ideas for a better syntax based on conversation with Zef
print! "Hello World"

// Implementation of if assert
if := {cond fn|
  assert cond!  // Abort returning nil if cond! returns a falsy value
  fn!           // tail call fn
}

// But how do we implement if..else?
  
// function with two block arguments, the ! means to execute
b := false
if! {a < 5} { b = true }
// Though this particular case would be better written as
b := a < 5

// Implementation of while
while := {cond fn| // Takes two parameters, the conditon block and the iteration block
  {
    assert cond!
    fn!
    loop
  }
}

// Count from 1 to 100 using while
i := 1 // decare a new local variable i and set to 1
while! { i <= 100 } {
  print! i
  i = i + 1
}

// Implementation of times
// loops i from 1 to n calling (fn i) for each
times := {n fn|
  i := 1
  {
    assert i <= n
    fn! i
    i = i + 1
    loop
  }
}

times! 10 print // Print from 1 to 10


// iterate method that returns an iterator of the list with optional begin and end
it := list.iterate!
{
  item := it.next!     // Get the next item in the iterator
  assert item ~= nil   // Abort if it's nil
  print! item          // Print it
  loop                 // repeat
}

// Implement forEach helper to loop over lists
forEach := {list fn|
  it = list.iterate!
  {
    item := it.next!      // Get the next item from the iterator
    assert item ~= nil    // Iterators return nil when they are done, we should bail then
    fn! item              // call the block once with the item
    loop                  // repeat using tail-call recursion
  }
}

// and now printing each item in the list is much simpler
forEach! list print

// Implement map that returns a new list
map := {list fn|
  new := []

// Map over a list
map! list.iterate! {item i|
  i, item.name
}