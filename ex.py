def appl_lvl_class_code_comparision(group):
        combined_retention_class_code = list(group["RETN_CLS_MV"].dropna().iloc[0])
        record_class_code = group["RCRD_CLS_CD"].dropna()
        combined_record_class_code = list(record_class_code.unique())
        return "Yes" if sorted(combined_retention_class_code) == sorted(combined_record_class_code) else "No"
