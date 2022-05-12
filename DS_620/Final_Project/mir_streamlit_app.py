from re import I
import streamlit as st
import time
import numpy as np
import pandas as pd
import plotly.express as px
import matplotlib.pyplot as plt

st.title('COVID in 2020')

@st.cache
def final_data():
    covid_stats_df =  pd.read_csv("resources/covid_stats_2020.csv")
    populations_df = pd.read_csv("resources/population_standardized_2020.csv")
    final_df = pd.merge(covid_stats_df, populations_df[['standard_names', 'Migrants (net)', 'Med. Age',\
                                                    'Urban Pop %']], on = 'standard_names',\
                   how = 'inner')
    return final_df
final_df = final_data()

# Plotly world map
st.subheader('World Map for COVID Confirmed Cases')
fig = px.choropleth(final_df[["standard_names", "ISO_3", "Confirmed"]], locations="ISO_3",
                    color="Confirmed", 
                    hover_name="standard_names", # column to add to hover information
                    color_continuous_scale=px.colors.sequential.Rainbow)
fig.update_layout(height=500, width = 1000)
st.plotly_chart(fig, use_container_width=False)

# Plotly linear regression chart
st.subheader('Infection rate VS. Stringency Index (Global)')
fig = px.scatter(final_df, x=final_df['stringency_index'], y=final_df['Infection_rate_f'],\
                 trendline="ols", trendline_color_override="red", hover_data = ['standard_names'])
fig.update_layout(height=800, width = 1000)
st.plotly_chart(fig, use_container_width=False)



progress_bar = st.sidebar.progress(round((1/12)*100))
status_text = st.sidebar.empty()

@st.cache
def load_data():
    data = pd.read_csv("resources/ultimate_no_null.csv")
    return data
ultimate_no_null_df = load_data()

country = st.selectbox('Pick a country', ultimate_no_null_df['standard_names'].unique().tolist())
@st.cache
def filter_data(selection):
    data = ultimate_no_null_df[['month', 'standard_names', 'Confirmed', 'stringency_index']][ultimate_no_null_df['standard_names']==selection].set_index('month', drop = True)
    return data
filtered_df = filter_data(country)

# Cases and Stringency Index line chart
st.subheader('Cases Trend')

last_rows = filtered_df[['Confirmed']][filtered_df['standard_names']==country].iloc[:1]
chart = st.line_chart(last_rows)
st.subheader('Stringency Trend')
slast_rows = filtered_df[['stringency_index']][filtered_df['standard_names']==country].iloc[:1]
schart = st.line_chart(slast_rows)
for i in range(2, 13):
    new_rows = filtered_df[['Confirmed']][filtered_df['standard_names']==country].iloc[i-1:i]
    snew_rows = filtered_df[['stringency_index']][filtered_df['standard_names']==country].iloc[i-1:i]
    status_text.text(f"Month {i}")
    chart.add_rows(new_rows)
    schart.add_rows(snew_rows)
    bar_prog = round((i/12)*100)
    progress_bar.progress(bar_prog)
    last_rows = new_rows
    slast_rows = snew_rows
    time.sleep(1.0)
    
progress_bar.empty()

# Infection rate and Stringency index dual line chart
st.subheader('Infection Rate Vs. Stringency Index (Country)')
def line_plots(selection):    
    months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    num_rcd = len(ultimate_no_null_df.loc[ultimate_no_null_df["standard_names"] == selection])
    x_axis= range(1,num_rcd+1)
    tick_locations = [value for value in x_axis]
    y1 = ultimate_no_null_df["Confirmed"].loc[ultimate_no_null_df["standard_names"] == selection]
    y2 = ultimate_no_null_df["stringency_index"].loc[ultimate_no_null_df["standard_names"] == selection]
    y3 = ultimate_no_null_df["Infection_rate"].loc[ultimate_no_null_df["standard_names"] == selection]\
            .str.rstrip('%').astype('float')
    max_count = y1.max()
    plt.rcdefaults()
    fig,ax1 = plt.subplots()
    plt.grid(alpha = .5, zorder = 0)
#     sns.set_palette("PuBuGn_d")
    data = ultimate_no_null_df.loc[ultimate_no_null_df["standard_names"] == country]
    ax1.set_xlabel("Month", fontsize =16)
    
#     ax1 = sns.lineplot(x= "month", y = "Confirmed", data = data , zorder = 3, palette='red')
    plt.plot(x_axis, y3, color='orange', linewidth=2, markersize=12, label = "Infection rate")
    plt.legend(loc='best')
    plt.xlim(0,13)
    plt.xlabel("2020")
    plt.ylabel("Infection rate")
    plt.title(f"{country} Covid confirmed trend for 2020")
    plt.xticks(tick_locations, months[:num_rcd], rotation="vertical")
#     if max_count >= 1000000:
#         ax1.set_ylabel("Confirmed in millions", fontsize =16)
   
        
    ax2 = ax1.twinx()
#     sns.set_palette("pastel")    
#     ax2 = sns.lineplot(x= "month", y = "stringency_index", data = data , zorder = 3, palette='blue').set_title(f"Confirmed vs. Stringency Index for {country}")
    plt.plot(x_axis, y2, color='blue', linewidth=2, markersize=12, label = "Stringency")
    
    plt.legend(loc='lower right')
    plt.ylim(0,100)
    plt.ylabel("Stringency (%)")
    plt.tight_layout()
    return fig
fig = line_plots(country)
st.pyplot(fig)