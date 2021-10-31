library(readxl)
Housing <- read_excel("C:/Users/Nandini/Desktop/520 Syllabus/MIDTERM/Housing.xlsx")
View(Housing)


class(Housing$bedrooms)
Housing$bedrooms <- as.factor(Housing$bedrooms)


summary(Housing)


View
model1 <- lm(Housing$price ~ Housing$lotsize)
summary(model1)


anova(model1)


model2 <- lm(Housing$price ~ Housing$lotsize +Housing$bedrooms)
anova(model2)


summary(model2)