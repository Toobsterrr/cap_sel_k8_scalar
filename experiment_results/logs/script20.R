data = as.matrix(read.delim(sep="\n", "success.dat"))
v1 = 15*20
l = length(data)
data = data[v1:l]
jpeg()
hist(data, xlab="Latencies", breaks=100)
print(sd(data))
