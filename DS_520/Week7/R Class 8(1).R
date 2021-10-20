

## One sample t-test

set.seed(1234)
my_data <- data.frame(
  name = paste0(rep("mice_", 10), 1:10),
  weight = round(rnorm(10, 20, 2), 1)
)


View(my_data)

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


my_table <- table(my_data$Species, my_data$size)
View(my_table)


## Chi -squre test

chisq.test(my_table)

chisq.test(table(my_data$Species, my_data$size))

