function greet(name) {
console.log("Hello", name);
}
function bye(name) {
console.log("Goodbye", name);
}
function runFunc(func) {
func("Kausar"); // HOF runs the function it receives
}
runFunc(greet); // Output: Hello Kausar
runFunc(bye);   // Output: Goodbye Kausar

                    //Simple Callback (no arguments)
function greet() {
console.log("Hello Kausar");
}
function runFunc(func) {
func(); 
}
runFunc(greet);
                            //Example with ()
function greet() {
console.log("Hello Kausar");
}
function runFunc(callback) {
console.log("Preparing...");
callback(); // run the callback here                                              
}                                                                  // greet     → pass function
                                                                  // greet()   → run function immediately → pass its result

                                                                 // Its result is passed to runFunc.
                                                                 // If greet() returns nothing, the result is undefined.
                                                                 // Then callback() causes an error because undefined is not a function.

runFunc(greet);                            



function greet(name) {           
console.log("Hello " + name);
}
function runGreeting(callback, personName, 
timeOfDay) {  
console.log(`Good ${timeOfDay}!`);
callback(personName);
}
runGreeting(greet, "Kausar", "morning")