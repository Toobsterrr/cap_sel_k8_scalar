import sys
print(sys.argv)
data = open(sys.argv[1])
data = data.read()

spl = data.split("residence times\": \"")

data2 = spl[1][:spl[1].index("run") - 4]
# print(spl[1].index("run") - 3)


data1 = spl[2][:spl[2].index("run") - 4]
# print(spl[2].index("run") - 3)


f1 = open("run1.dat", "w")
f2 = open("run2.dat", "w")
f1.write(data1)
f2.write(data2)
f1.close()
f2.close()

data1 = data1.strip().split(" ")
data2 = data2.strip().split(" ")

f1 = map(lambda x: float(x), data1)
f2 = map(lambda x: float(x), data2)
mean1 = sum(f1)/len(data1)
mean2 = sum(f2)/len(data2)
middle1 = int(len(data1)/2)
middle2 = int(len(data2)/2)

f1 = map(lambda x: float(x), data1)
f2 = map(lambda x: float(x), data2)

median1 = sorted(list(f1))[middle1]
median2 = sorted(list(f2))[middle2]

print("mean1: " + str(mean1))
print("mean2: " + str(mean2))
print("median1: " + str(median1))
print("median2: " + str(median2))
