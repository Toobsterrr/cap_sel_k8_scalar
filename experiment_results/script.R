data = as.matrix(read.delim(sep="\n", "success.dat"))
v1 = 15*20
l = length(data)
hist(data[v1:l], breaks=100, xlabel="latencies")
