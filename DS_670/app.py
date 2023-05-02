# dependencies
from flask import Flask, render_template, jsonify ,url_for, request
import pandas as pd
import numpy as np
from sqlalchemy import create_engine
import json
import requests
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from tensorflow.keras.models import load_model
from sqlalchemy import text

# establishing DB connection 
database_path = "Resources/NJ_County_DB.sqlite"
engine = create_engine(f"sqlite:///{database_path}", echo=True)

# table names

school = "nj_school_performance"
poverty = "nj_poverty_median_income"
crime = "nj_crime_detail"
population = "nj_population"
tax='nj_property_tax'

# --- create an instance of the Flask class ---
app = Flask(__name__)

# render index.html
@app.route('/')
def home():
    return render_template("index.html")

# render d3.html 
@app.route('/d3')
def d3():
    return render_template("d3.html")

# get data for d3 plot
@app.route('/api/d3_data')
def d3_data():
    sqlite_connection = engine.connect()
      
    query = '''SELECT POV.county_name, POV.median_hh_income, POV.poverty_rate, POV.county_code,
           CRM.total AS total_offense, ROUND(CRM2.total,2) AS rate_per_100k, CRM3.total AS total_arrest,
           POP.population, SCH.school_score, tax_rate
           FROM nj_poverty_median_income AS POV 
           
           INNER JOIN 
           (SELECT county_name, sum(total) as total 
           FROM nj_crime_detail 
           WHERE report_type = 'Number of Offenses' AND year =2020
           GROUP BY county_name) AS CRM 
           ON POV.county_name = CRM.county_name 
           
           INNER JOIN 
           (SELECT county_name, sum(total) as total 
           FROM nj_crime_detail 
           WHERE report_type = 'Rate Per 100,000' AND year =2020
           GROUP BY county_name) AS CRM2 
           ON POV.county_name = CRM2.county_name
           
           INNER JOIN 
           (SELECT county_name, sum(total) as total 
           FROM nj_crime_detail 
           WHERE report_type = 'Number of Arrests' AND year =2020
           GROUP BY county_name) AS CRM3 
           ON POV.county_name = CRM3.county_name
           INNER JOIN 
           (SELECT county_name, SUM(est_pop) AS population 
           FROM nj_population WHERE year =2021 GROUP BY county_name) AS POP 
           ON POV.county_name = POP.county_name
           INNER JOIN 
           (SELECT county_name, ROUND(AVG(score),2) AS school_score 
           FROM nj_school_performance WHERE year =2020 GROUP BY county_name) AS SCH 
           ON POV.county_name = SCH.county_name
           INNER JOIN 
           (SELECT county_name, AVG(tax_rate) as tax_rate
           FROM nj_property_tax WHERE year =2022 GROUP BY county_name) AS TAX ON POV.county_name = TAX.county_name
           
           WHERE POV.year = 2021;'''
    df = pd.read_sql(text(query), sqlite_connection)

    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# render plotly.html
@app.route('/plotly')
def plotly():
    return render_template("plotly.html")

# get data for plotly plot
@app.route('/api/plotly_data')
def plotly_data():
    sqlite_connection = engine.connect()
    
    query = '''SELECT T1.*, T2.population, T3.tax_rate
    FROM 
    (SELECT county_name,median_hh_income,poverty_rate 
    FROM nj_poverty_median_income WHERE year=2021) AS T1
    INNER JOIN 
    (SELECT county_name, SUM(est_pop) as population 
    FROM nj_population WHERE year=2021 GROUP BY county_name) AS T2
    ON T1.county_name = T2.county_name
    INNER JOIN 
    (SELECT county_name, AVG(tax_rate) as tax_rate 
    FROM nj_property_tax WHERE year=2022 GROUP BY county_name) AS T3
    ON T1.county_name = T3.county_name;
    '''
    metadata_df = pd.read_sql_query(query, sqlite_connection)
    metadata_dict = metadata_df.to_dict(orient='records')

    query='''
    SELECT county_name, school,grades,rank,school_type, score FROM nj_school_performance WHERE year=2020 ORDER BY county_name, score DESC;
    '''
    school_df = pd.read_sql_query(query, sqlite_connection)
    school_dict = school_df.to_dict(orient='records')

    query='''
    SELECT * FROM nj_crime_detail WHERE year=2020 AND report_type = 'Number of Offenses'
    '''
    crime_df = pd.read_sql_query(query, sqlite_connection)
    crime_dict = crime_df.to_dict(orient='records')
    sqlite_connection.close()
    data_json= {}
    data_json["metadata"] = metadata_dict
    data_json["school"] = school_dict
    data_json["crime"] = crime_dict
    print("Data retrieval successfull")
    return jsonify(data_json)

# get crime data for plotly sunburst
@app.route('/api/sunburst_crime_data')
def sunburst_crime_data():
    sqlite_connection = engine.connect()
      
    query1 = '''SELECT DISTINCT "NJ-"||county_name AS id , county_name AS label,  '' AS parent, SUM(count) AS value FROM 
            (SELECT county_name, 'murder' AS crime_type, SUM(murder) AS count 
            FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'rape' AS crime_type, SUM(rape) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'robbery' AS crime_type, SUM(robbery) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'assault' AS crime_type, SUM(assault) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'burglary' AS crime_type, SUM(burglary) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'larceny' AS crime_type, SUM(larceny) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'auto_theft' AS crime_type, SUM(auto_theft) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2)
        GROUP BY 1,2,3'''
    df1 = pd.read_sql(text(query1), sqlite_connection)

    query2 = '''SELECT DISTINCT county_name||"-"||crime_type AS id ,crime_type AS label,  "NJ-"||county_name AS parent, SUM(count) AS value FROM 
            (SELECT county_name, 'murder' AS crime_type, SUM(murder) AS count 
            FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'rape' AS crime_type, SUM(rape) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'robbery' AS crime_type, SUM(robbery) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'assault' AS crime_type, SUM(assault) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'burglary' AS crime_type, SUM(burglary) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'larceny' AS crime_type, SUM(larceny) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2
        UNION ALL 
        SELECT county_name, 'auto_theft' AS crime_type, SUM(auto_theft) AS count 
        FROM nj_crime_detail WHERE report_type = 'Number of Offenses' AND year=2020 GROUP BY 1,2)
        GROUP BY 1,2,3'''
    df2 = pd.read_sql(text(query2), sqlite_connection)
    
    df = pd.concat([df1, df2])
    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# get tax data for plotly sunburst
@app.route('/api/sunburst_tax_data')
def sunburst_tax_data():
    sqlite_connection = engine.connect()
      
    query1 = '''SELECT DISTINCT "NJ-"||county_name AS id , county_name AS label,  '' AS parent, AVG(tax_rate) AS value
                FROM nj_property_tax WHERE year=2022
                GROUP BY 1,2,3'''
    df1 = pd.read_sql(query1, sqlite_connection)

    query2 = '''SELECT DISTINCT county_name||"-"||district_name AS id ,district_name AS label,  "NJ-"||county_name AS parent, tax_rate AS value
                FROM nj_property_tax WHERE year=2022''' 
    df2 = pd.read_sql(query2, sqlite_connection)
    
    df = pd.concat([df1, df2])
    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# get school data for plotly sunburst
@app.route('/api/sunburst_school_data')
def sunburst_school_data():
    sqlite_connection = engine.connect()

    query1 = '''SELECT DISTINCT "NJ-"||county_name AS id , county_name AS label,  '' AS parent, AVG(score) AS value FROM 
            (SELECT county_name,district,grades,school,score
            FROM 
              ( SELECT county_name,district,grades,school, score,
                       ROW_NUMBER() OVER (PARTITION BY county_name
                                          ORDER BY score DESC) AS rn
                FROM nj_school_performance WHERE year=2020) AS tmp 
            WHERE rn <= 3
            ORDER BY county_name) GROUP BY 1,2,3'''
    df1 = pd.read_sql(query1, sqlite_connection)
    
    query2 = '''SELECT DISTINCT county_name||"-"||grades AS id ,grades AS label,  "NJ-"||county_name AS parent, AVG(score) AS value FROM 
            (SELECT county_name,district,grades,school,score
            FROM 
              ( SELECT county_name,district,grades,school, score,
                       ROW_NUMBER() OVER (PARTITION BY county_name
                                          ORDER BY score DESC) AS rn
                FROM nj_school_performance WHERE year=2020) AS tmp 
            WHERE rn <= 3
            ORDER BY county_name) GROUP BY 1,2,3'''
    df2 = pd.read_sql(query2, sqlite_connection)

    query3 = '''SELECT DISTINCT grades||"-"||district AS id ,district AS label,  county_name||"-"||grades AS parent, AVG(score) AS value FROM 
            (SELECT county_name,district,grades,school,score
            FROM 
              ( SELECT county_name,district,grades,school, score,
                       ROW_NUMBER() OVER (PARTITION BY county_name
                                          ORDER BY score DESC) AS rn
                FROM nj_school_performance WHERE year=2020) AS tmp 
            WHERE rn <= 3
            ORDER BY county_name) GROUP BY 1,2,3'''
    df3 = pd.read_sql(query3, sqlite_connection)
    
    query4 = '''SELECT DISTINCT district||"-"||school AS id ,school AS label,  grades||"-"||district AS parent, AVG(score) AS value FROM 
        (SELECT county_name,district,grades,school,score
        FROM 
            ( SELECT county_name,district,grades,school, score,
                    ROW_NUMBER() OVER (PARTITION BY county_name
                                        ORDER BY score DESC) AS rn
            FROM nj_school_performance WHERE year=2020) AS tmp 
        WHERE rn <= 3
        ORDER BY county_name) GROUP BY 1,2,3'''
    df4 = pd.read_sql(query4, sqlite_connection)
    
    df = pd.concat([df1, df2, df3, df4])
    
    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# get population data for plotly sunburst
@app.route('/api/sunburst_pop_data')
def sunburst_pop_data():
    sqlite_connection = engine.connect()
      
    query1 = '''SELECT DISTINCT "NJ-"||county_name AS id , county_name AS label,  '' AS parent, SUM(population) AS value 
                FROM nj_crime_detail WHERE year=2020                                                                                              
                GROUP BY 1,2,3'''
    df1 = pd.read_sql(query1, sqlite_connection)

    query2 = '''SELECT DISTINCT county_name||"-"||agency AS id ,agency AS label,  "NJ-"||county_name AS parent, SUM(population) AS value
                FROM nj_crime_detail  WHERE year=2020 GROUP BY 1,2,3'''
    df2 = pd.read_sql(query2, sqlite_connection)
    
    df = pd.concat([df1, df2])
    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# get median household income data for plotly sunburst
@app.route('/api/sunburst_hi_data')
def sunburst_hi_data():
    sqlite_connection = engine.connect()
      
    query1 = '''SELECT DISTINCT "NJ-"||county_name AS id , county_name AS label,  '' AS parent, median_hh_income AS value 
                FROM nj_poverty_median_income WHERE year=2021;'''
    df = pd.read_sql(query1, sqlite_connection)

    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# get poverty data for plotly sunburst
@app.route('/api/sunburst_poverty_data')
def sunburst_poverty_data():
    sqlite_connection = engine.connect()
      
    query1 = '''SELECT DISTINCT "NJ-"||county_name AS id , county_name AS label,  '' AS parent, poverty_rate AS value 
                FROM nj_poverty_median_income WHERE year=2021;'''
    df = pd.read_sql(query1, sqlite_connection)

    data_csv = df.to_csv(encoding='utf-8')
    sqlite_connection.close()
    
    print("Data retrieval successfull")
    
    return data_csv

# get school data for d3 sunburst
@app.route('/api/d3_sunburst_schools')
def d3_sunburst_schools():
    f = open("static/data/school.json")
    data = json.load(f)
    return data

# # @app.route('/api/d3_sunburst_schools')
# # def d3_sunburst_schools():
# #     sqlite_connection = engine.connect()

# #     query = '''SELECT county_name,district_name,gradespan,school_name,rating FROM NJ_school_rating ORDER BY county_name,district_name,gradespan,school_name;'''
# #     test = pd.read_sql_query(query, sqlite_connection)
    
# #     sqlite_connection.close()
    
# #     print("Query successfull")
    
# #     data_json = {}
# #     data_json["name"] = "school"
# #     data_json["description"] = "school"
    
# #     counties = list(test['county_name'].unique())
    
# #     children = []
# #     for i in range(len(counties)):
# #         child1 = {}
# #         child1["name"] = counties[i]
# #         child1["description"] = test['rating'].loc[test['county_name']==counties[i]].mean()
# #         district = list(test['district_name'].loc[test['county_name']==counties[i]].unique())
# #         child2_list = []
# #         for k in range(len(district)):
# #             child2 = {}
# #             child2["name"] = district[k]
# #             child2["description"] = test['rating'].loc[(test['county_name']==counties[i]) & (test['district_name'] == district[k])].mean()
# #             child3_list = []
# #             gradespan = list(test['gradespan'].loc[(test['county_name']==counties[i]) & (test['district_name'] == district[k])].unique())
# #             for j in range(len(gradespan)):
# #                 child3 = {}
# #                 child3["name"] = gradespan[j]
# #                 child3["description"] = test["rating"].loc[(test['county_name']==counties[i]) & (test['district_name'] == district[k]) & (test['gradespan'] == gradespan[j])].mean()
# #                 child4_list = []
# #                 for index,row in test.loc[(test['county_name']==counties[i]) & (test['district_name'] == district[k]) & (test['gradespan'] == gradespan[j])].iterrows():
# #                     child4 = {}
# #                     child4["name"] = row["school_name"]
# #                     child4["description"] = row["rating"]
# #                     child4["size"] = row["rating"]
# #                     child4_list.append(child4)
# #                 child3["children"] = child4_list
# #                 child3_list.append(child3)
# #             child2["children"] = child3_list
# #             child2_list.append(child2)
# #         child1["children"] = child2_list
# #         children.append(child1)
        
# #     data_json["children"] = children
# #     with open("static/data/school.json", "w",encoding ='utf8') as outfile:  
# #         json.dump(data_json, outfile, indent = 1) 
# #     print("Data retrieval successfull")
# #     if data_json:
# #         print("Json ready")
# #     else:
# #         print("Json failed!")
# #     return jsonify(data_json)

# get tax data for d3 sunburst
@app.route('/api/d3_sunburst_tax')
def d3_sunburst_tax():
    f = open("static/data/tax_sunburst.json")
    data = json.load(f)
    return data

# # @app.route('/api/d3_sunburst_tax')
# # def d3_sunburst_tax():
# #     sqlite_connection = engine.connect()
    
# #     query = '''SELECT DISTINCT * FROM NJ_tax'''
# #     test = pd.read_sql_query(query, sqlite_connection)
# #     print("Query successfull")
    
# #     sqlite_connection.close()
    
# #     data_json2 = {}
# #     data_json2["name"] = "tax"
# #     data_json2["description"] = "tax"
    
# #     counties = list(test['county_name'].unique())
    
# #     children = []
# #     for i in range(len(counties)):
# #         child1 = {}
# #         child1["name"] = counties[i]
# #         child1["description"] = test['effective_tax_rate'].loc[test['county_name']==counties[i]].mean()
# #         district = list(test['district_name'].loc[test['county_name']==counties[i]].unique())
# #         child2_list = []
# #         for k in range(len(district)):
# #             for index,row in test.loc[(test['county_name']==counties[i]) & (test['district_name'] == district[k])].iterrows():
# #                 child2 = {}
# #                 child2["name"] = row["district_name"]
# #                 child2["description"] = row["effective_tax_rate"]
# #                 child2["size"] = row["effective_tax_rate"]
# #                 child2_list.append(child2)
# #         child1["children"] = child2_list
# #         children.append(child1)
# #     data_json2["children"] = children
# #     with open("static/data/tax_sunburst.json", "w",encoding ='utf8') as outfile:  
# #         json.dump(data_json2, outfile, indent = 1) 
# #     print("Data retrieval successfull")
# #     if data_json2:
# #         print("Json ready")
# #     else:
# #         print("Json failed!")
# #     return jsonify(data_json2)

# get crime data for d3 sunburst
@app.route('/api/d3_sunburst_crime')
def d3_sunburst_crime():
    f = open("static/data/crime.json")
    data = json.load(f)
    return data

# # @app.route('/api/d3_sunburst_crime')
# # def d3_sunburst_crime():
# #     sqlite_connection = engine.connect()
    
# #     query = ''' SELECT * FROM (SELECT county_name, police_dept, 'murder' AS crime_type, murder AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0
# #         UNION ALL SELECT county_name, police_dept, 'rape' AS crime_type, rape AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0
# #         UNION ALL SELECT county_name, police_dept, 'robbery' AS crime_type, robbery AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0
# #         UNION ALL SELECT county_name, police_dept, 'assault' AS crime_type, assault AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0
# #         UNION ALL SELECT county_name, police_dept, 'burglary' AS crime_type, burglary AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0
# #         UNION ALL SELECT county_name, police_dept, 'larceny' AS crime_type, larceny AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0
# #         UNION ALL SELECT county_name, police_dept, 'auto_theft' AS crime_type, auto_theft AS count FROM NJ_crime_detail  WHERE report_type = 'Rate Per 100,000' AND total <> 0)
# #         ORDER BY 1,2,3'''
# #     test = pd.read_sql_query(query, sqlite_connection)
# #     print("Query successfull")
    
# #     sqlite_connection.close()
    
# #     data_json3 = {}
# #     data_json3["name"] = "crime"
# #     data_json3["description"] = "crime"
    
# #     counties = list(test['county_name'].unique())
    
# #     children = []
# #     children = []
# #     for i in range(len(counties)):
# #         child1 = {}
# #         child1["name"] = counties[i]
# #         child1["description"] = test['count'].loc[test['county_name']==counties[i]].mean()
# #         police_dept = list(test['police_dept'].loc[test['county_name']==counties[i]].unique())
# #         child2_list = []
# #         for k in range(len(police_dept)):
# #             child2 = {}
# #             child2["name"] = police_dept[k]
# #             child2["description"] = test['count'].loc[(test['county_name']==counties[i]) & (test['police_dept'] == police_dept[k])].mean()
# #             child3_list = []
# #             crime_type = list(test['crime_type'].loc[(test['county_name']==counties[i]) & (test['police_dept'] == police_dept[k])].unique())
# #             for j in range(len(crime_type)):
# #                 for index,row in test.loc[(test['county_name']==counties[i]) & (test['police_dept'] == police_dept[k]) & (test['crime_type'] == crime_type[j])].iterrows():
# #                     child3 = {}
# #                     child3["name"] = row["crime_type"]
# #                     child3["description"] = row["count"]
# #                     child3["size"] = row["count"]
# #                     child3_list.append(child3)
# #                 child2["children"] = child3_list
# #             child2_list.append(child2)
# #         child1["children"] = child2_list
# #         children.append(child1)
# #     data_json3["children"] = children
# #     with open("static/data/crime.json", "w",encoding ='utf8') as outfile:  
# #         json.dump(data_json3, outfile, indent = 1) 
# #     print("Data retrieval successfull")
# #     if data_json3:
# #         print("Json ready")
# #     else:
# #         print("Json failed!")
# #     return jsonify(data_json3)

# render leaflet.html  
@app.route('/leaflet')
def leaflet():
    return render_template("leaflet.html")

# get leaflet geojson
@app.route('/api/leaflet_data')
def leaflet_data():
    f = open("static/data/final.geojson")
    data = json.load(f)
    return data

# @app.route('/api/leaflet_data')
# def leaflet_data():
#     sqlite_connection = engine.connect()
#     query = '''
#         SELECT T1.*, T2.school_score, T3.tax_rate, T4.poverty_rate, T5.median_hh_income, T6.population
#         FROM
#         (SELECT county_name, sum(total) as crime_rate 
#         FROM nj_crime_detail WHERE report_type = 'Rate Per 100,000' AND year=2020 GROUP BY 1) AS T1
#         INNER JOIN 
#         (SELECT county_name, AVG(score) AS school_score 
#         FROM nj_school_performance WHERE year=2020 GROUP BY 1) AS T2 
#         ON T1.county_name = T2.county_name
#         INNER JOIN (SELECT county_name, AVG(tax_rate) AS tax_rate 
#         FROM nj_property_tax WHERE year=2022 GROUP BY 1) AS T3
#         ON T1.county_name = T3.county_name
#         INNER JOIN 
#         (SELECT county_name, AVG(poverty_rate) AS poverty_rate 
#         FROM nj_poverty_median_income WHERE year=2021 GROUP BY 1) AS T4
#         ON T1.county_name = T4.county_name
#         INNER JOIN 
#         (SELECT county_name, AVG(median_hh_income) AS median_hh_income 
#         FROM nj_poverty_median_income WHERE year=2021 GROUP BY 1) AS T5
#         ON T1.county_name = T5.county_name
#         INNER JOIN 
#         (SELECT county_name, SUM(est_pop) AS population 
#         FROM nj_population WHERE year=2021 GROUP BY 1) AS T6
#         ON T1.county_name = T6.county_name
#     '''
#     test = pd.read_sql_query(query, sqlite_connection)

#     geojson_url = 'https://opendata.arcgis.com/datasets/5f45e1ece6e14ef5866974a7b57d3b95_1.geojson'
#     geojson = requests.get(geojson_url).json()
#     print("Geojson retrieval successfull")

#     for i in range(len(geojson['features'])):
#         county = geojson['features'][i]['properties']['COUNTY']
#         geojson['features'][i]['properties']['crime_rate'] = \
#             round(test['crime_rate'].loc[test['county_name']==county].item(),2)
#         geojson['features'][i]['properties']['school_score'] = \
#             round(test['school_score'].loc[test['county_name']==county].item(),2)
#         geojson['features'][i]['properties']['tax_rate'] = \
#             round(test['tax_rate'].loc[test['county_name']==county].item(),2)
#         geojson['features'][i]['properties']['poverty_rate'] = \
#             round(test['poverty_rate'].loc[test['county_name']==county].item(),2)
#         geojson['features'][i]['properties']['median_hh_income'] = \
#             round(test['median_hh_income'].loc[test['county_name']==county].item(),2)
#         geojson['features'][i]['properties']['population'] = \
#             test['population'].loc[test['county_name']==county].item()
#     print("Geojson modification successfull")
#     return jsonify(geojson)

# render bonus.html  
@app.route('/bonus')
def bonus():
    return render_template("bonus.html")


# render filter.html  
@app.route('/filter')
def filter():
    return render_template("filter.html")

# get data from population for filtering
@app.route("/api/data_pop_filter")
def data_pop_filter():
    sqlite_connection = engine.connect()
    query = "SELECT * from nj_population"
    df = pd.read_sql(query, sqlite_connection)
    sqlite_connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from tax for filtering
@app.route("/api/data_tax_filter")
def data_tax_filter():
    sqlite_connection = engine.connect()
    query = "SELECT * from nj_property_tax"
    df = pd.read_sql(text(query), sqlite_connection)
    sqlite_connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from crime for filtering
@app.route("/api/data_rent_filter")
def data_crime_filter():
    sqlite_connection = engine.connect()
    query = "SELECT * from nj_zillow_observed_rent_index"
    df = pd.read_sql(text(query), sqlite_connection)
    sqlite_connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from crime detail for filtering
@app.route("/api/data_crime_det_filter")
def data_crime_det_filter():
    sqlite_connection = engine.connect()
    query = "SELECT * from nj_crime_detail;"
    df = pd.read_sql(text(query), sqlite_connection)
    sqlite_connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from school for filtering
@app.route("/api/data_school_filter")
def data_school_filter():
    sqlite_connection = engine.connect()
    query = "SELECT * from nj_school_performance;"
    df = pd.read_sql(text(query), sqlite_connection)
    sqlite_connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from zillow price for filtering
@app.route("/api/data_zillow_filter")
def data_zillow_filter():
    connection = engine.connect()
    query = '''SELECT * from nj_zillow_house_value_index;'''
    df = pd.read_sql(text(query), connection)
    connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from APR history for filtering
@app.route("/api/data_apr_filter")
def data_apr_filter():
    connection = engine.connect()
    query = '''SELECT * FROM nj_mortgage_rates; '''
    df = pd.read_sql(query, connection)
    connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from crime history for filtering
@app.route("/api/data_adi_filter")
def data_adi_filter():
    connection = engine.connect()
    query = '''SELECT * from nj_adi'''
    df = pd.read_sql(text(query), connection)
    connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from poverty history for filtering
@app.route("/api/data_poverty_history_filter")
def data_poverty_history_filter():
    connection = engine.connect()
    query = '''SELECT * from nj_poverty_median_income;'''
    df = pd.read_sql(text(query), connection)
    connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from poverty history for filtering
@app.route("/api/data_distance_filter")
def data_distance_filter():
    connection = engine.connect()
    query = '''SELECT * from nj_counties_dist_to_major_cities;'''
    df = pd.read_sql(text(query), connection)
    connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# get data from poverty history for filtering
@app.route("/api/data_food_filter")
def data_food_filter():
    connection = engine.connect()
    query = '''SELECT * from nj_food_desert;'''
    df = pd.read_sql(text(query), connection)
    connection.close()
    data_csv = df.to_csv(header=True, index = False, encoding='utf-8')  
    print("Data retrieval successfull")
    return data_csv

# linear regression endpoint
@app.route("/prediction", methods=['GET','POST'])
def prediction():
    rfreg__model = joblib.load('Models/NJ_rfm_house_price2.sav')
    lr_model = joblib.load('Models/NJ_lin_reg.sav')
    df = pd.read_csv('Resources/final_data.csv')
    df2 = pd.read_csv('Resources/final_data2.csv')
    le = LabelEncoder()
    df2['county_label'] = le.fit_transform(df2['county_name'])
    ref_df = df2[['county_name','county_label']].drop_duplicates().reset_index(drop=True)
    if request.method == "POST":
        
        # getting input for county from HTML form
        county = request.form.get("county").upper()
        
        # county_label=ref_df[ref_df['county_name']==county]['county_label'].values[0]
        # getting input for year from HTML form 
        year = int(request.form.get("year"))
        beds = int(request.form.get("beds"))
        
        connection = engine.connect()
        query = f'''SELECT * from nj_zillow_house_value_index WHERE county_name='{county}' AND year=2023 AND num_of_bedrooms={beds};'''
        price_df = pd.read_sql(text(query), connection)
        connection.close()
        price_now = round(price_df['house_value_index'].values[0],2)
        df_filtered=df[(df['county_name']==county)]
        corr = df_filtered.corr()
        corr.fillna(0, inplace=True)
        #    linear regression prediction
        lr_best_array = df[(df[f'county_name']==county)&\
                (df['num_of_bedrooms']==beds)].tail(1)
        lr_best_array['year']=year
        lr_best_array['avg_tax_rate']=df[df['county_name']==county]['avg_tax_rate'].min()
        lr_best_array.reset_index(drop=True,inplace=True)
            
        lr_best_predictions = lr_model.predict(lr_best_array.drop('house_value_index',axis=1))
        
        worst_array = df[(df[f'county_name']==county)&\
              (df['num_of_bedrooms']==beds)].head(1)
        worst_array['year']=year
        worst_array['avg_tax_rate']=df[df['county_name']==county]['avg_tax_rate'].max()
        worst_array.reset_index(drop=True,inplace=True)
        
        lr_worst_predictions = lr_model.predict(worst_array.drop('house_value_index',axis=1))

        #    random forest regression prediction
        df_filtered=df2[(df2['county_name']==county)][['county_name','year', 'num_of_bedrooms', 'est_pop', 'median_hh_income',
       'poverty_count', 'poverty_rate', 'tax_rate', 'county_label']]
        county_label=ref_df[ref_df['county_name']==county]['county_label'].values[0]
        rf_best_array = df_filtered[(df_filtered['county_name']==county)&\
                    (df_filtered['num_of_bedrooms']==beds)].tail(1)
        rf_best_array['year']=year
        rf_best_array['county_label']=county_label
        rf_best_array.reset_index(drop=True,inplace=True)
        rf_b_predictions = rfreg__model.predict(rf_best_array.drop(['county_name'],axis=1))
        
        rf_worst_array = df_filtered[(df_filtered['county_name']==county)&\
              (df_filtered['num_of_bedrooms']==beds)].head(1)
        rf_worst_array['year']=year
        rf_worst_array['county_label']=county_label
        rf_worst_array.reset_index(drop=True,inplace=True)
        rf_w_predictions = rfreg__model.predict(rf_worst_array.drop(['county_name'],axis=1))
        
        result_df= pd.DataFrame({'Prediction Model':['Linear Regresion', 'Random Forest Regression'],'County': [county, county],\
                                    "Year":[year, year], "No. of Beds":[str(beds)+'+' if beds==5 else str(beds) for i in range(2)],\
                                        "2023 Price":[price_now,price_now],\
                                        "Best Case ZHVI ($)": [round(lr_best_predictions[0],2), round(rf_b_predictions[0],2)],\
                                    "Worst Case ZHVI ($)": [round(lr_worst_predictions[0],2), round(rf_w_predictions[0],2)]})
        html_table = result_df.to_html(index=False, header=True, border=1, justify = 'left',classes="bg-light table table-striped table-bordered")
        results = html_table
        return render_template('prediction.html', info = results)
    return render_template('prediction.html')

# Radnom forest and deep learning endpoint
@app.route("/prediction2", methods=['GET','POST'])
def prediction2():
    rfm_model = joblib.load("Models/NJ_rfm.sav")
    deep_model = load_model("Models/NJ_deep_learning.h5")
    df = pd.read_csv('Resources/final_data2.csv')
    X = df.drop(['county_name','st_abb','state_code', 'county_code', 'est_pop'], axis=1)
    y = df["county_name"]
    X_train, X_test, y_train, y_test = train_test_split(X, y, random_state=1)
    X_scaler = MinMaxScaler().fit(X_train)
    label_encoder = LabelEncoder()
    label_encoder.fit(y_train)
    if request.method == "POST":
       # getting input for income from HTML form
       income = int(request.form.get("income"))

       # getting input for budget from HTML form
       budget = int(request.form.get("budget"))
       # getting input for beds from HTML form
       beds = int(request.form.get("beds"))
       # getting input for poverty type from HTML form
       pov_typ = request.form.get("poverty")
       df_latest=df[df['year']==df['year'].max()]
       
       poverty_count=df_latest['poverty_count'].max() if pov_typ=='max' else df_latest['poverty_count'].mean() if pov_typ=='mean' else df_latest['poverty_count'].min()
       poverty_rate=df_latest['poverty_rate'].max() if pov_typ=='max' else df_latest['poverty_rate'].mean() if pov_typ=='mean' else df_latest['poverty_rate'].min()

       rfm_array=pd.DataFrame({'year':df_latest['year'].max(),
                        'num_of_bedrooms':beds,
                        'house_value_index':budget,
                        'median_hh_income':income,
                        'poverty_rate':poverty_rate},[0])
       rfm_predictions = rfm_model.predict(rfm_array)
        
       deep_learning_array = pd.DataFrame({'year':df['year'].max(),
                                            'num_of_bedrooms':beds,
                                            'house_value_index':budget,
                                            'median_hh_income':income,
                                            'poverty_count': round(poverty_count) ,
                                            'poverty_rate': round(poverty_rate,2),
                                            'tax_rate': df_latest['tax_rate'].mean(),
                                            'apr_30': df_latest['apr_30'].mean(),
                                            'points_30': df_latest['points_30'].mean(),
                                            'apr_15': df_latest['apr_15'].mean(),
                                            'points_15': df_latest['points_15'].mean()},[0])
       deep_learning_array_scaled = X_scaler.transform(deep_learning_array)
       deep_learning_prediction = np.argmax(deep_model.predict(deep_learning_array_scaled), axis = -1)
       deep_learning_predicted_labels = label_encoder.inverse_transform(deep_learning_prediction)
       
       result_df= pd.DataFrame({'Income': income,'Budget': budget, '# of Bedrooms':beds, "Accepted Poverty Type": pov_typ, 'Random Forest Classifier Prediction': rfm_predictions, "Deep Learning Prediction": deep_learning_predicted_labels})
       html_table = result_df.to_html(index=False, header=True, border=1, justify = 'left',classes="bg-light table table-striped table-bordered")
       results = html_table 
       return render_template('prediction.html', info2 = results)
    return render_template('prediction.html')

# # render tableau.html
@app.route('/tableau')
def tableau():
    return render_template("tableau.html")

if __name__ == "__main__":
    app.run(debug = True)
