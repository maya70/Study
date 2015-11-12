#!/usr/bin/env python
import random
import sqlite3
import sys
import string


def countEdges(n, matrix):
	# count the number of edges
	numedj = 0
	for i in range(n):
		for j in range(i):
			if matrix[i][j] > 0:
				numedj += 1

	#print(numedj)
	return int(numedj)

def deleteFirst(n, matrix):
	for i in range(n):
				for j in range(i):
					if matrix[i][j] > 0:
						matrix[i][j] = matrix[j][i] = 0
						return

def insertFirst(n, matrix):
	for i in range(n):  
				for j in range(i):
					if matrix[i][j] == 0:
						matrix[i][j] = matrix[j][i] = 1
						break

def random_adjacency_matrix(n, e):
	if e > (n * (n-1))/2:
		e = (n * (n-1))/2  # max allowed number of edges for a complete graph

	matrix = [[random.randint(0,1) for i in range(n)] for j in range(n)]
	
	
	# no self connections
	for i in range(n):
		matrix[i][i] = 0


	# symmetry
	for i in range(n):
		for j in range(n):
			matrix[j][i] = matrix[i][j]

	

	numedj = countEdges(n, matrix)
	print("number of edges = " + str(numedj))
	
	# adjust number of edges
	while numedj > e:
		r = random.randint(0,n-1)   # select a random index for row
		c = random.randint(0,n-1)	# select a random index for col
		if matrix[r][c] > 0:   # found a random edge.. delete it
			#print("Deleting edge "+ str(r) + " , " + str(c))
			matrix[r][c] = matrix[c][r] = 0   # delete edge
		else: # delete the first available edge
			deleteFirst(n, matrix)
		numedj -= 1

	while numedj < e:
		r = random.randint(0,n-1)   # select a random index for row
		c = random.randint(0,n-1)	# select a random index for col

		if matrix[r][c] == 0: # insert random edge
			#print (str(r) + " , " + str(c))
			matrix[r][c] = matrix[c][r] = 1   # add edge
		else:   # insert in first available slot
			inserFirst(n, matrix) 
		numedj += 1


	print("adjusted number of edges = " + str(numedj))
	
	return matrix

# utility function to check if a node is connected to at least one other node
def hasEdge(i, m):
	sizeM = len(m)
	for j in range(sizeM):
		if m[i][j] > 0:
			return True

	return False

# utility function to generate a randome ID
def generateCode(size=6, chars=string.ascii_uppercase + string.digits):
	return ''.join(random.choice(chars) for _ in range(size))

# utility function to check for duplicate codes
def foundMatch(clist, b):
	match = any(b in s for s in clist)
	return match


# function to write a relation table
def write_rel_table(m):
		sizeM = len(m)
		index_list = []
		code_list = []

		#print("M is " + str(sizeM) + " x " + str(sizeM))
		for i in range(sizeM):
			if hasEdge(i, m):
				# generate a label for it
				b = generateCode()
					#print("node "+ str(i) + " has ID:" + b)
				# make sure the label is not a duplicate
				while foundMatch(code_list, b):
					print("found duplicate")
					b=generateCode()

				# store both i and the generated label in a node list
				index_list.append(i)
				code_list.append(b)

		# Create table
		conn = sqlite3.connect('mydata.db')
		c = conn.cursor()

		c.execute('DROP TABLE IF EXISTS links')
		c.execute('CREATE TABLE links (src text, dst text, w real, PRIMARY KEY(src, dst))')

		print ("Number of nodes = " + str(len(index_list)))
		for i in range(len(index_list)):
			# fetch node i's edges
			nodeID = index_list[i]
			#print("Src node: "+ str(nodeID))
			weight = 1.0
			for j in range(nodeID):
				 #print("j = " + str(j))
				v = m[nodeID][j]
				if v > 0:
					# write tuple (current node's code, adjacen node's code)
					adj = index_list.index(j)
					#print("adjacent to: " + str(adj))
					c.execute('''INSERT INTO links(src, dst, w)
									VALUES(?, ?, ?)''', (code_list[i], code_list[adj], weight)
									)


		# display results
		c.execute('SELECT * FROM links')
		for (src, dst, w) in c:
			print(src + " \t " + dst + "\t" + str(w))


		conn.commit()




def main():
	a = random_adjacency_matrix(int(sys.argv[1]), int(sys.argv[2]))
	print(a)

	write_rel_table(a)

main()
