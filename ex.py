"using csv export with automated drop file"

import re
import os
import traceback
import requests
from flask import Blueprint, current_app
from datetime import datetime, timedelta
import pandas as pd
from utils import (
    config,
    drop_file,
    get_cre_ts,
    get_exec_id,
    get_access_token,
    update_exec_status_to_waiting,
    ingest_dataframe_to_db
)

data_ownr_info_app = Blueprint('data_ownr_info_app', __name__)

ENVIRONMENT = os.environ.get("RUN_ENV","LOCAL").upper()
BASE_PATH = os.path.dirname(os.path.abspath(__file__))

EXEC_ID_FORMAT = '%Y%m%d%H%M%S'

SOURCE_PREFIX = 'DATA_OWNR_INFO'
TABLE_NAME = SOURCE_PREFIX+"_INGS"
HEADER_ROW = 0

DATA_OWNR_INFO_COLUMNS = ["APPL_SYS_ID","APPL_SYS_NM","APPL_SYS_STS_NM","CDO_CD",
                          "LOB_CD","DATA_OWNR_SID","ENTL_TX","USER_SID","USER_NM",
                          "USER_ROLE_TYPE","ASGN_MTHD","ASGN_STS","CREATOR_SID","CREATED_ON",
                          "REMOVER","REMOVED_ON","INGS_PROC_EXEC_ID","CRE_TS"]

HEADERS_MAP = {
    "Application ID" :"APPL_SYS_ID",
    "Application Name" :"APPL_SYS_NM",
    "Application State" :"APPL_SYS_STS_NM",
    "Chief Data Office" :"CDO_CD",
    "LOB" :"LOB_CD",
    "Data Owner SID" :"DATA_OWNR_SID",
    "Entitlement" :"ENTL_TX",
    "User SID" :"USER_SID",
    "User Name" :"USER_NM",
    "Role Type" :"USER_ROLE_TYPE",
    "Assignment Method" :"ASGN_MTHD",
    "Assignment Status" :"ASGN_STS",
    "Creator" :"CREATOR_SID",
    "Created" :"CREATED_ON",
    "Remover" :"REMOVER",         
    "Removed" :"REMOVED_ON",
}        

def fetch_data_ownr_info_data():
    """
    """
    try:
        access_token = 'Bearer '+get_access_token("CATALOG")
        current_app.logger.info("Catalog access token retrived")
    except Exception as e:
        current_app.logger.error("Error while getting token for catalog with: {0}".format(e))
        return "Authorization error while generating token for CATALOG API"
    
    data_ownr_info_url = config['CATALOG']['data_owner_info_url']
    headers = {"Content-Type": "application/csv",
               "Authorization": access_token}
    try:
        resp = requests.get(data_ownr_info_url, verify=False, headers=headers)
    except Exception as e:
        current_app.logger.error("Error while getting data from Catalog API with {0}".format(e))
        resp = {}
    return resp

def drop_csv_file_to_dropbox(response, source_prefix):
    exec_id = get_exec_id()
    source_prefix = source_prefix.upper()
    file_name = source_prefix + "_" + exec_id + ".csv"
    folder = os.path.join(BASE_PATH, 'attachments')
    if not os.path.exists(folder):
        os.mkdir(folder)
    file_path = os.path.join(folder, file_name)
    start_dt =  datetime.strptime(exec_id, EXEC_ID_FORMAT)
    try:
        with open(file_path, "wb") as f:
            f.write(response.content)
        if ENVIRONMENT!="LOCAL":
            drop_file(file_path, file_name)
            os.remove(file_path)
        update_exec_status_to_waiting(exec_id, file_name, source_prefix)
        current_app.logger.info("Successfully dropped file at location: {0}".format(file_path))
        result = "Successfully dropped data file: {0} at location!".format(file_name), 200
        upload_status = "COMPLETED"
    except Exception as e:
        upload_status = "ERROR"
        response_msg = "File Upload Failed for ({0} and EXEC_ID {1}) with {2}".format(
                source_prefix, 
                exec_id,
                str(e)
                )
        current_app.logger.error(response_msg)
        result = response_msg, 500
    finally:
        end_dt = datetime.now()
        current_app.logger.info(
            "File Upload Ended for ({0} and INGS_EXEC_ID {1}) with INGS_STS_CD {2} in {3} Seconds".format(
                source_prefix, 
                exec_id,
                upload_status,
                (end_dt-start_dt).seconds
                )
            )
    return result

def dataframe_wrapper(df):
    df.rename(columns = lambda x:x.strip(), inplace=True)
    df.rename(columns = HEADERS_MAP, inplace=True)
    df['CRE_TS'] = get_cre_ts()
    return df

@data_ownr_info_app.route('/drop_'+SOURCE_PREFIX.lower()+'_ingestion_file')
def drop_data_ownr_info_ingestion_file():
    current_app.logger.info("Started downloading CSV export for Data Owner and Data Owner Delegate")
    data_owner_info = fetch_data_ownr_info_data()
    if data_owner_info:
        try:
            return drop_csv_file_to_dropbox(data_owner_info, SOURCE_PREFIX)
        except Exception as e:
            current_app.logger.error(
                "Encountered error while getting csv data from catalog {}".format(e))
            return "Encountered error while getting csv data from catalog", 400
    else:
        current_app.logger.error(
            "Unable to fetch data of data owner info from catalog application..so exiting")
        return data_owner_info, 400

@data_ownr_info_app.route('/ingest_'+SOURCE_PREFIX.lower()+'_data')
def ingest_data_ownr_info_data():
    return ingest_dataframe_to_db(TABLE_NAME, SOURCE_PREFIX, dataframe_wrapper,HEADER_ROW)
