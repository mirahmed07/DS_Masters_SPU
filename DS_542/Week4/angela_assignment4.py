import pandas as pd
pop_df = pd.read_html('https://www.infoplease.com/us/states/state-population-by-rank')[0]
pop_dict = pop_df[['State', '2020 Census']][:-1].set_index('State').to_dict(orient = 'dict')
final_dict = pop_dict['2020 Census']
for key,value in final_dict.items():
    if final_dict[key] >= 6500000:
        print(f'{key} : {value}')