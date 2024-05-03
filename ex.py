DATA_OWNR_INFO_DF = self.get_dataframe_from_source("DATA_OWNR_INFO", "QUERY")
DATA_OWNR_INFO_DF = DATA_OWNR_INFO_DF.groupby('APPL_SYS_ID')['USER_NM'].apply('; '.join).reset_index(drop=True)

def test_extract_and_transform_success(mocker, context):
    with context:
        mock_req = MagicMock()
        mock_req.args = {"target_type": "file"}
        retn_rem_report = RetnRemediationReport(mock_req)
        
        SEAL_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "SEAL_DF.csv"))
        LEGAL_HOLD_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "LEGAL_HOLD_DF.csv"))
        DATAFIT_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "DATAFIT_DF.csv"))
        DATA_OWNR_INFO_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "DATA_OWNR_INFO_DF.csv"))
        DD_COMPLIANCE_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "DD_COMPLIANCE_DF.csv"))
        ASET_INV_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "ASET_INV_DF.csv"))
        DB_GROWTH_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "DB_GROWTH_DF.csv"))
        ASET_RETN_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "ASET_RETN_DF.csv"))
        FINAL_DF = pd.read_csv(os.path.join(
            base_test_data_path, "retn_rem_report", "FINAL_DF.csv"))
        print(f" \n new final df \n : {FINAL_DF.columns}")
        print(f" \n data owner df \n : {DATA_OWNR_INFO_DF.columns}")
        mocker.patch('reports.retn_rem_report.retn_rem_main.RetnRemediationReport.get_dataframe_from_source', side_effect=[
                    SEAL_DF, LEGAL_HOLD_DF, DATAFIT_DF, DATA_OWNR_INFO_DF, DD_COMPLIANCE_DF, ASET_INV_DF, DB_GROWTH_DF, ASET_RETN_DF])
        
        final_df = retn_rem_report.extract_and_transform()
        print(f" \n final df \n : {final_df.columns}")
        final_df = final_df.loc[:, ~final_df.columns.str.match("Unnamed")]
        FINAL_DF = FINAL_DF.loc[:, ~FINAL_DF.columns.str.match("Unnamed")]
        pd.set_option('display.max_columns', None)  # or 1000
        pd.set_option('display.max_rows', None)  # or 1000
        pd.set_option('display.max_colwidth', None)
        assert final_df.shape==FINAL_DF.shape
        
