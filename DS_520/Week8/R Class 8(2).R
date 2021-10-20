

## One sample t-test

my_data <- data.frame(
  name = paste0(rep("mice_", 10), 1:10),
  weight = round(rnorm(10, 20, 2), 1)
)

View(my_data)
m = mean(my_data$weight)
sd = sd(my_data$weight)

m 
sd
#Ho : mu = 25 Ha: != <> 25
# if the average weight of the mice differs from 25g

# two-tailed test
result <- t.test(my_data$weight, mu = 25)

result

#one tailed 
#if the average weight of the mice is greater than 25g

t.test(my_data$weight, mu = 25, alternative = "greater")

#one tailed 
#if the average weight of the mice is less than 25g

t.test(my_data$weight, mu = 25, alternative = "less")


## Two sample t-test

women <- c(38.9, 61.2, 73.3, 21.8, 63.4, 64.6, 48.4, 48.8, 48.5)
men <- c(67.8, 60, 63.4, 76, 89.4, 73.3, 67.3, 61.3, 62.4)

## Two Sided test

t.test(women, men , var.equal = T )

# One -sided test

t.test(women, men , var.equal = T , alternative = 'greater')

# One -sided test

t.test(women, men , var.equal = T , alternative = 'less')


##### CHI SQUARE DISTRIBUITON #####


my_data <- iris
View(my_data)

my_data$size <- ifelse(my_data$Sepal.Length < median(my_data$Sepal.Length),
                   "small", "big"
)

median(my_data$Sepal.Length)

my_table <- table(my_data$Species, my_data$size)
View(my_table)

## One Sample Proportion Test

#H0 : p^ = 0.5
#Ha : p^ > 0.5

#Sample1 = 13/20
pcap = 13/20
p = 0.5

prop.test(13,20,p, alternative = "greater")

## TWO Sample Proportion Test

#H0: p1^ = p2^ : p1^-p2^ = 0
#Ha: p1^ != p2^

m = 705
w = 688
n = m+w

p1cap = 0.146
p2cap = 0.091

p1succ = 705*0.146
p2succ = 688 *0.091
x= c(103,63)
n= c(705,688)

prop.test(x,n, alternative = "greater")



## Chi -squre test

chisq.test(my_table)

chisq.test(table(my_data$Species, my_data$size))

