import streamlit as st
import pandas as pd
from deepface import DeepFace
import os
from PIL import Image
import numpy as np
from threshold_optimizer import genetic_algorithm, particle_swarm_optimization

# Page config
st.set_page_config(
    page_title="Face Recognition App",
    page_icon="👤",
    layout="wide"
)

# Add page navigation in sidebar
page = st.sidebar.radio("Navigation", ["Face Recognition", "Image Comparison"])

# ==================== PAGE 1: FACE RECOGNITION (ORIGINAL CODE) ====================
if page == "Face Recognition":
    # Title and description
    st.title("🔍 Face Recognition System")
    st.markdown("Upload an image to identify the person from our database")
    excel_path = "sheet.xlsx"
    db_path = "data"

    @st.cache_data
    def compute_optimal_threshold():
        # ⚠️ Replace with real distances from your dataset
        genuine = np.load("genuine_distances.npy")
        imposter = np.load("imposter_distances.npy")

        ga_threshold = genetic_algorithm(genuine, imposter)
        pso_threshold = particle_swarm_optimization(genuine, imposter)

    # hybrid average
        final_threshold = (ga_threshold + pso_threshold) / 2

        return final_threshold

    # Sidebar for configuration
    with st.sidebar:
        st.header("⚙️ Settings")
        excel_file = st.text_input("Excel File Path", value="sheet.xlsx")
        data_dir = st.text_input("Dataset Directory", value="data")
        # confidence_threshold = st.slider("Confidence Threshold", 0.0, 1.0, 0.6, 0.05)
        confidence_threshold = compute_optimal_threshold()

        st.sidebar.success(
            f"Auto Threshold: {confidence_threshold:.3f}"
        )

        st.markdown("---")
        st.markdown("### Model Info")
        st.info("**Model:** ArcFace\n\n**Detector:** RetinaFace\n\n**Similarity:** Cosine")
    
    # Function to load person data from Excel
    @st.cache_data
    def load_person_data(excel_path):
        try:
            df = pd.read_excel(excel_path)
            # Assuming Excel has 'person_id' and 'name' columns
            return df
        except Exception as e:
            st.error(f"Error loading Excel file: {e}")
            return None

    # Function to perform face recognition
    def recognize_face(uploaded_image, db_path):
        try:
            # Save uploaded image temporarily
            temp_path = "temp_uploaded.jpg"
            uploaded_image.save(temp_path)
            
            # Perform face recognition
            with st.spinner("Analyzing face..."):
                result = DeepFace.find(
                    img_path=temp_path,
                    db_path=db_path,
                    model_name="ArcFace",
                    detector_backend="retinaface",
                    distance_metric="cosine",
                    enforce_detection=True,
                    silent=True
                )
            
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
            
            return result
        
        except Exception as e:
            if os.path.exists("temp_uploaded.jpg"):
                os.remove("temp_uploaded.jpg")
            raise e

    # Main content
    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("📤 Upload Image")
        uploaded_file = st.file_uploader(
            "Choose an image...", 
            type=['png', 'jpg', 'jpeg'],
            help="Upload a clear face image for recognition"
        )
        
        if uploaded_file is not None:
            image = Image.open(uploaded_file)
            st.image(image, caption="Uploaded Image", use_container_width=True)

    with col2:
        st.subheader("🎯 Recognition Results")
        
        if uploaded_file is not None:
            if st.button("🔎 Recognize Face", type="primary", use_container_width=True):
                try:
                    # Load person data from Excel
                    person_df = load_person_data(excel_file)
                    
                    if person_df is None:
                        st.error("Failed to load person database. Please check the Excel file path.")
                    else:
                        # Perform recognition
                        image = Image.open(uploaded_file)
                        results = recognize_face(image, data_dir)
                        
                        if len(results) > 0 and len(results[0]) > 0:
                            # Get the best match
                            best_match = results[0].iloc[0]
                            matched_image_path = best_match['identity']
                            distance = best_match['distance']
                            
                            # Calculate confidence (1 - cosine distance)
                            confidence = 1 - distance
                            
                            # Extract person_id from filename
                            filename = os.path.basename(matched_image_path)
                            person_id = filename.split('.')[0]
                            
                            # Look up person name from Excel
                            person_row = person_df[person_df['Inmate Id'].astype(str) == str(person_id)]
                            
                            if not person_row.empty:
                                person_name = person_row.iloc[0]['Name']
                                
                                # Display results
                                if confidence >= confidence_threshold:
                                    st.success(f"✅ **Match Found!**")
                                    st.metric("Person Name", person_name)
                                    st.metric("Confidence Score", f"{confidence:.2%}")
                                    st.metric("Person ID", person_id)
                                    
                                    # Show matched image
                                    st.markdown("**Matched Database Image:**")
                                    matched_img = Image.open(matched_image_path)
                                    st.image(matched_img, width=200)
                                else:
                                    st.warning(f"⚠️ Low confidence match ({confidence:.2%})")
                                    st.info(f"Possible match: {person_name} (ID: {person_id})")
                            else:
                                st.error(f"Person ID '{person_id}' not found in database")
                        else:
                            st.warning("⚠️ No face detected or no match found in database")
                            
                except Exception as e:
                    st.error(f"Error during recognition: {str(e)}")
                    st.info("Please ensure:\n- The image contains a clear face\n- Dataset directory exists and contains images\n- Excel file is properly formatted")

    # Footer with instructions
    st.markdown("---")
    with st.expander("📋 Instructions & Requirements"):
        st.markdown("""
        ### Setup Requirements:
        1. **Excel File Format:** Should contain columns `person_id` and `name`
        2. **Dataset Directory:** Should contain images named as `person_id.png` (e.g., `001.png`, `002.png`)
        3. **Install Dependencies:**
           ```bash
           pip install streamlit deepface pandas openpyxl pillow
           ```
        
        ### How to Use:
        1. Upload an image containing a face
        2. Click "Recognize Face" button
        3. View the matched person's name and confidence score
        
        ### Model Details:
        - **Recognition Model:** ArcFace (highly accurate for face recognition)
        - **Face Detector:** RetinaFace (robust face detection)
        - **Similarity Metric:** Cosine similarity
        - **Confidence:** Higher scores indicate better matches (0-100%)
        """)

# ==================== PAGE 2: IMAGE COMPARISON (NEW FEATURE) ====================
elif page == "Image Comparison":
    st.title("🔄 Face Image Comparison")
    st.markdown("Upload two images to compare if they are of the same person")
    @st.cache_data
    def compute_optimal_threshold():
        # ⚠️ Replace with real distances from your dataset
        genuine = np.load("genuine_distances.npy")
        imposter = np.load("imposter_distances.npy")

        ga_threshold = genetic_algorithm(genuine, imposter)
        pso_threshold = particle_swarm_optimization(genuine, imposter)

    # hybrid average
        final_threshold = (ga_threshold + pso_threshold) / 2

        return final_threshold
    # ================= AUTO THRESHOLD =================
    @st.cache_data
    def get_auto_threshold():
        return compute_optimal_threshold()

    # Sidebar settings
    with st.sidebar:
        st.header("⚙️ Comparison Settings")

        auto_threshold = get_auto_threshold()

        st.success(f"Auto Threshold: {auto_threshold:.4f}")

        st.markdown("---")
        st.markdown("### Model Info")
        st.info(
            "**Model:** ArcFace\n\n"
            "**Detector:** RetinaFace\n\n"
            "**Metric:** Cosine Distance"
        )

    # ================= FACE VERIFY FUNCTION =================
    def compare_faces(image1, image2):
        try:
            temp_path1 = "temp_image1.jpg"
            temp_path2 = "temp_image2.jpg"

            image1.save(temp_path1)
            image2.save(temp_path2)

            with st.spinner("Comparing faces..."):
                result = DeepFace.verify(
                    img1_path=temp_path1,
                    img2_path=temp_path2,
                    model_name="ArcFace",
                    detector_backend="retinaface",
                    distance_metric="cosine",
                    enforce_detection=True
                )

            # cleanup
            if os.path.exists(temp_path1):
                os.remove(temp_path1)
            if os.path.exists(temp_path2):
                os.remove(temp_path2)

            return result

        except Exception as e:
            if os.path.exists("temp_image1.jpg"):
                os.remove("temp_image1.jpg")
            if os.path.exists("temp_image2.jpg"):
                os.remove("temp_image2.jpg")
            raise e

    # ================= UI =================
    col1, col2 = st.columns(2)

    with col1:
        st.subheader("📷 First Image")
        image1_file = st.file_uploader(
            "Upload first image",
            type=['png', 'jpg', 'jpeg'],
            key="image1"
        )

        if image1_file is not None:
            image1 = Image.open(image1_file)
            st.image(image1, caption="First Image", use_container_width=True)

    with col2:
        st.subheader("📷 Second Image")
        image2_file = st.file_uploader(
            "Upload second image",
            type=['png', 'jpg', 'jpeg'],
            key="image2"
        )

        if image2_file is not None:
            image2 = Image.open(image2_file)
            st.image(image2, caption="Second Image", use_container_width=True)

    st.markdown("---")

    # ================= COMPARISON =================
    if image1_file is not None and image2_file is not None:
        col_btn, _ = st.columns([1, 2])

        with col_btn:
            compare_btn = st.button(
                "🔍 Compare Faces",
                type="primary",
                use_container_width=True
            )

        if compare_btn:
            try:
                img1 = Image.open(image1_file)
                img2 = Image.open(image2_file)

                result = compare_faces(img1, img2)

                # 🔥 IMPORTANT — USE YOUR THRESHOLD
                distance = result["distance"]
                verified = distance <= auto_threshold
                confidence = 1 - distance

                # ================= RESULTS =================
                st.subheader("🎯 Comparison Results")

                col_res1, col_res2, col_res3 = st.columns(3)

                with col_res1:
                    if verified:
                        st.success("✅ **SAME PERSON**")
                    else:
                        st.error("❌ **DIFFERENT PERSONS**")

                with col_res2:
                    st.metric("Confidence Score", f"{confidence:.2%}")

                with col_res3:
                    st.metric("Distance", f"{distance:.4f}")

                # ================= DETAILS =================
                st.markdown("---")
                st.markdown("### 📊 Detailed Metrics")

                col_detail1, col_detail2 = st.columns(2)

                with col_detail1:
                    st.info(f"**Auto Threshold:** {auto_threshold:.4f}")
                    st.info(f"**Measured Distance:** {distance:.4f}")

                with col_detail2:
                    if verified:
                        st.success("**Decision:** Below threshold ✓")
                    else:
                        st.warning("**Decision:** Above threshold ✗")

                # confidence bar
                st.markdown("### 📈 Confidence Level")
                st.progress(float(max(0, min(confidence, 1))))

                # safety interpretation
                if verified and confidence > 0.75:
                    st.success(f"High confidence match ({confidence:.1%})")
                elif verified:
                    st.warning(f"Borderline match ({confidence:.1%})")
                else:
                    st.error(f"No reliable match ({confidence:.1%})")

            except Exception as e:
                st.error(f"Error during comparison: {str(e)}")
                st.info(
                    "Please ensure:\n"
                    "- Both images contain clear faces\n"
                    "- Images are supported formats"
                )

    else:
        st.info("👆 Please upload both images to start comparison")

    # ================= FOOTER =================
    st.markdown("---")
    with st.expander("📋 How to Use Image Comparison"):
        st.markdown("""
### Instructions:
1. Upload first image  
2. Upload second image  
3. Click **Compare Faces**  
4. System uses **auto-learned threshold**

### Notes:
- Lower distance = more similar  
- Threshold is learned from YOUR dataset  
- Much safer than default DeepFace
""")
        
# import streamlit as st
# import pandas as pd
# from deepface import DeepFace
# import os
# from PIL import Image
# import numpy as np

# # Page config
# st.set_page_config(
#     page_title="Face Recognition App",
#     page_icon="👤",
#     layout="wide"
# )

# # Title and description
# st.title("🔍 Face Recognition System")
# st.markdown("Upload an image to identify the person from our database")
# excel_path = "sheet.xlsx"
# db_path = "data"

# # Sidebar for configuration
# with st.sidebar:
#     st.header("⚙️ Settings")
#     excel_file = st.text_input("Excel File Path", value="sheet.xlsx")
#     data_dir = st.text_input("Dataset Directory", value="data")
#     confidence_threshold = st.slider("Confidence Threshold", 0.0, 1.0, 0.6, 0.05)
    
#     st.markdown("---")
#     st.markdown("### Model Info")
#     st.info("**Model:** ArcFace\n\n**Detector:** RetinaFace\n\n**Similarity:** Cosine")

# # Function to load person data from Excel
# @st.cache_data
# def load_person_data(excel_path):
#     try:
#         df = pd.read_excel(excel_path)
#         # Assuming Excel has 'person_id' and 'name' columns
#         return df
#     except Exception as e:
#         st.error(f"Error loading Excel file: {e}")
#         return None

# # Function to perform face recognition
# def recognize_face(uploaded_image, db_path):
#     try:
#         # Save uploaded image temporarily
#         temp_path = "temp_uploaded.jpg"
#         uploaded_image.save(temp_path)
        
#         # Perform face recognition
#         with st.spinner("Analyzing face..."):
#             result = DeepFace.find(
#                 img_path=temp_path,
#                 db_path=db_path,
#                 model_name="ArcFace",
#                 detector_backend="retinaface",
#                 distance_metric="cosine",
#                 enforce_detection=True,
#                 silent=True
#             )
        
#         # Clean up temp file
#         if os.path.exists(temp_path):
#             os.remove(temp_path)
        
#         return result
    
#     except Exception as e:
#         if os.path.exists("temp_uploaded.jpg"):
#             os.remove("temp_uploaded.jpg")
#         raise e

# # Main content
# col1, col2 = st.columns([1, 1])

# with col1:
#     st.subheader("📤 Upload Image")
#     uploaded_file = st.file_uploader(
#         "Choose an image...", 
#         type=['png', 'jpg', 'jpeg'],
#         help="Upload a clear face image for recognition"
#     )
    
#     if uploaded_file is not None:
#         image = Image.open(uploaded_file)
#         st.image(image, caption="Uploaded Image", use_container_width=True)

# with col2:
#     st.subheader("🎯 Recognition Results")
    
#     if uploaded_file is not None:
#         if st.button("🔎 Recognize Face", type="primary", use_container_width=True):
#             try:
#                 # Load person data from Excel
#                 person_df = load_person_data(excel_file)
                
#                 if person_df is None:
#                     st.error("Failed to load person database. Please check the Excel file path.")
#                 else:
#                     # Perform recognition
#                     image = Image.open(uploaded_file)
#                     results = recognize_face(image, data_dir)
                    
#                     if len(results) > 0 and len(results[0]) > 0:
#                         # Get the best match
#                         best_match = results[0].iloc[0]
#                         matched_image_path = best_match['identity']
#                         distance = best_match['distance']
                        
#                         # Calculate confidence (1 - cosine distance)
#                         confidence = 1 - distance
                        
#                         # Extract person_id from filename
#                         filename = os.path.basename(matched_image_path)
#                         person_id = filename.split('.')[0]
                        
#                         # Look up person name from Excel
#                         person_row = person_df[person_df['Inmate Id'].astype(str) == str(person_id)]
                        
#                         if not person_row.empty:
#                             person_name = person_row.iloc[0]['Name']
                            
#                             # Display results
#                             if confidence >= confidence_threshold:
#                                 st.success(f"✅ **Match Found!**")
#                                 st.metric("Person Name", person_name)
#                                 st.metric("Confidence Score", f"{confidence:.2%}")
#                                 st.metric("Person ID", person_id)
                                
#                                 # Show matched image
#                                 st.markdown("**Matched Database Image:**")
#                                 matched_img = Image.open(matched_image_path)
#                                 st.image(matched_img, width=200)
#                             else:
#                                 st.warning(f"⚠️ Low confidence match ({confidence:.2%})")
#                                 st.info(f"Possible match: {person_name} (ID: {person_id})")
#                         else:
#                             st.error(f"Person ID '{person_id}' not found in database")
#                     else:
#                         st.warning("⚠️ No face detected or no match found in database")
                        
#             except Exception as e:
#                 st.error(f"Error during recognition: {str(e)}")
#                 st.info("Please ensure:\n- The image contains a clear face\n- Dataset directory exists and contains images\n- Excel file is properly formatted")

# # Footer with instructions
# st.markdown("---")
# with st.expander("📋 Instructions & Requirements"):
#     st.markdown("""
#     ### Setup Requirements:
#     1. **Excel File Format:** Should contain columns `person_id` and `name`
#     2. **Dataset Directory:** Should contain images named as `person_id.png` (e.g., `001.png`, `002.png`)
#     3. **Install Dependencies:**
#        ```bash
#        pip install streamlit deepface pandas openpyxl pillow
#        ```
    
#     ### How to Use:
#     1. Upload an image containing a face
#     2. Click "Recognize Face" button
#     3. View the matched person's name and confidence score
    
#     ### Model Details:
#     - **Recognition Model:** ArcFace (highly accurate for face recognition)
#     - **Face Detector:** RetinaFace (robust face detection)
#     - **Similarity Metric:** Cosine similarity
#     - **Confidence:** Higher scores indicate better matches (0-100%)
#     """)