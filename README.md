Specs Crêpe
===========

Check it out at [specs-crepe.herokuapp.com](http://specs-crepe.herokuapp.com/)

## What is it?

This is a little Node app I wrote to eliminate a silly manual process we had to go through for a project rollout -- the porting of html tabular data into a slightly different html table containing the same data.

But, really, it was just an excuse to try out a few things I've been wanting to try :D


## How it works

It's effectively a scraper. Built atop of a [Node][node] + [Express][express] foundation, it uses [Request][request] to... request the the source page containing the tabular data we want. We then parse the response using [cheerio][cheerio] to create a clean array of objects, which we pass to a [Jade][jade] template to produce our final re-formatted html!

The frontend is used to get set various options to modify the output, particulary which model's specifications we want. You'll recognise the familiar [Bootstrap][bootstrap] stylings.


## Installation

You'll need [Node][node] (at least 0.8.x) installed.

First, clone the repo:

```sh
$ git clone git@github.com:victornguyen/specs-crepe.git
```

Change to the specs-crepe directory:

```sh
$ cd specs-crepe
```

Install the Node dependencies:

```sh
$ npm install
```

Start the app:

```sh
$ node app.js
```

You should then be able to use the app by visiting localhost:3000


## What it uses
- [Node.js][node]
- [Express][express]
- [cheerio][cheerio]
- [Request][request]
- [Jade][jade]
- [Bootstrap][bootstrap]


[node]: http://nodejs.org/
[express]: http://expressjs.com/
[cheerio]: https://github.com/MatthewMueller/cheerio
[request]: https://github.com/mikeal/request
[jade]: http://jade-lang.com/
[bootstrap]: http://twitter.github.com/bootstrap/
