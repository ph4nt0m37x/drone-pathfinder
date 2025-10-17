# drone-pathfinder

This is a simple web-based pathfinding demo built using only JavaScript. It simulates how a drone can find its way through an environment with obstacles using grid-based pathfinding.
The grid is interactive, the users can decide the size (rows and columns), set a starting point and an ending point, as well as place walls. 
The design process follows Markov's Decision Process, and the optimal path is calculated using the Bellman equation.

## Movement
The drone can move in four directions (North, South, East, West), or optionally in eight directions (including Northeast, Northwest, Southeast, and Southwest), depending on the user’s choice.


Movement is not deterministic: when the drone attempts to fly in a chosen direction, there is a 70% chance it will succeed, and a 30% chance it will drift sideways; 15% to either side of the intended direction.
If the drone passes over a hazardous cell, it crashes and receives a negative utility equal to the repair cost.


## Goal
The goal of the algorithm is to determine the optimal next step the drone should take regardless of its current position. This ensures that not only can the full optimal path be planned from the start to the goal, but also that the drone can recover if it is blown off course by wind or forced to deviate due to other external factors. From any position on the grid, the drone can always refer to the computed policy to decide the best possible move toward the goal.
