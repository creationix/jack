" Vim syntax file
setlocal iskeyword+=:
" Language:     Jack Script
" Maintainer:   Tim Caswell

if exists("b:current_syntax")
  finish
endif

setlocal iskeyword+=-
setlocal iskeyword+=?
setlocal iskeyword+=!


let b:current_syntax = "jack"

syn keyword jackTodo            contained TODO FIXME XXX
syn match   jackComment         "--.*$" contains=jackTodo,@Spell
syn keyword jackConstant null
syn keyword jackBoolean true false
syn region jackString  start=+'+ end=+'+ skip=+\\\\\|\\'+ contains=jackSpecial,@Spell
syn region jackString  start=+"+ end=+"+ skip=+\\\\\|\\"+ contains=jackSpecial,@Spell
syn match jackNumber "\<0\>"
syn match jackNumber "\<[1-9][0-9]*\>"
syn match jackNumber "\<0[xX]\x\+\>"
syn keyword jackType Integer Boolean Null String Buffer List Object Function
syn keyword jackConditional if elif else
syn keyword jackRepeat for in while split and
syn keyword jackKeyword vars delete is 
syn keyword jackException abort
syn keyword jackFunction print rand range inspect bind i-collect i-keys i-values i-pairs i-map i-filter i-chunk i-collect i-zip i-merge i-each i-any? i-all?
"syn match jackIdentifier \<[a-zA-Z_][a-zA-Z0-9_-]*[?!]*\>
"syn keyword jackOperator \|\| ^^ + - / * # %


highlight link jackTodo                Todo
highlight link jackComment             Comment
highlight link jackConstant            Constant
highlight link jackBoolean             Boolean
highlight link jackString              String
highlight link jackNumber              Number
highlight link jackType                Type
highlight link jackConditional         Conditional
highlight link jackRepeat              Repeat
highlight link jackKeyword             Keyword
highlight link jackException           Exception
highlight link jackFunction            Function
"highlight link jackOperator            Operator
"highlight link jackIdentifier          Identifier
