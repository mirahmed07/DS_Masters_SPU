data <- read.csv("C:/Users/Nandini/Desktop/crop.data.csv")
View(data)

summary(data)

is.numeric(data$fertilizer)


class(data$fertilizer)
data$fertilizer = as.factor(data$fertilizer)


class(data$density)
data$density <- as.factor(data$density)


## ONE WAY ANOVA

model <- aov(yield ~ fertilizer, data = data)
summary(model)

is.factor(data$fertilizer)

  #Tukey Test
TukeyHSD(model)




## TWO WAY ANOVA 

model2 <-aov(yield ~ fertilizer * density, data = data)
summary(model2)

  #Tuckey Test
TukeyHSD(model2)
