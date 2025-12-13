"""
Report Generator for EcoWatch
Generates PDF reports with analysis data and images
"""
import os
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from datetime import datetime
from PIL import Image as PILImage
import io

def generate_report(analysis_data, output_path):
    """
    Generate a PDF report from analysis data
    
    Args:
        analysis_data: Dictionary containing:
            - lat, lng: Location coordinates
            - forest_coverage_percent: Forest coverage percentage
            - deforestation_percent: Deforestation percentage
            - image_before: Path to before image
            - image_after: Path to after image
            - mask: Path to mask image
            - original_image_path: Full path to original image
            - before_path: Full path to before image
            - after_path: Full path to after image
            - mask_path: Full path to mask image
        output_path: Path where PDF will be saved
    """
    # Create PDF document
    doc = SimpleDocTemplate(output_path, pagesize=letter)
    story = []
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        textColor=colors.HexColor('#00CED1'),
        spaceAfter=30,
        alignment=TA_CENTER
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#2E8B57'),
        spaceAfter=12,
        spaceBefore=12
    )
    
    # Title
    story.append(Paragraph("EcoWatch Forest Analysis Report", title_style))
    story.append(Spacer(1, 0.2*inch))
    
    # Report metadata
    report_date = datetime.now().strftime("%B %d, %Y at %I:%M %p")
    location_text = f"Location: {analysis_data.get('lat', 'N/A')}°N, {analysis_data.get('lng', 'N/A')}°E"
    
    metadata = [
        [Paragraph(f"<b>Report Generated:</b> {report_date}", styles['Normal']),
         Paragraph(f"<b>{location_text}</b>", styles['Normal'])],
    ]
    
    metadata_table = Table(metadata, colWidths=[4*inch, 3*inch])
    metadata_table.setStyle(TableStyle([
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
    ]))
    story.append(metadata_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Analysis Results Section
    story.append(Paragraph("Analysis Results", heading_style))
    
    forest_coverage = analysis_data.get('forest_coverage_percent', 0)
    deforestation = analysis_data.get('deforestation_percent', 0)
    
    # Results table
    results_data = [
        ['Metric', 'Value', 'Status'],
        ['Forest Coverage', f'{forest_coverage:.2f}%', 
         '✅ Healthy' if forest_coverage > 70 else '⚠️ Moderate' if forest_coverage > 40 else '🔴 Critical'],
        ['Deforestation Level', f'{deforestation:.2f}%',
         '✅ Low' if deforestation < 30 else '⚠️ Moderate' if deforestation < 60 else '🔴 High'],
    ]
    
    results_table = Table(results_data, colWidths=[2.5*inch, 2*inch, 2.5*inch])
    results_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2E8B57')),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 12),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ('FONTSIZE', (0, 1), (-1, -1), 10),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.lightgrey]),
    ]))
    story.append(results_table)
    story.append(Spacer(1, 0.3*inch))
    
    # Image Comparison Section
    story.append(Paragraph("Visual Analysis", heading_style))
    
    # Helper function to add image if it exists
    def add_image_if_exists(image_path, caption, max_width=5*inch):
        if image_path and os.path.exists(image_path):
            try:
                # Resize image if needed
                img = PILImage.open(image_path)
                img_width, img_height = img.size
                aspect_ratio = img_height / img_width
                
                if img_width > max_width:
                    new_width = max_width
                    new_height = new_width * aspect_ratio
                else:
                    new_width = img_width
                    new_height = img_height
                
                story.append(Image(image_path, width=new_width, height=new_height))
                story.append(Spacer(1, 0.1*inch))
                story.append(Paragraph(f"<i>{caption}</i>", styles['Normal']))
                story.append(Spacer(1, 0.2*inch))
                return True
            except Exception as e:
                print(f"⚠️ Error loading image {image_path}: {e}")
                story.append(Paragraph(f"<i>Image not available: {caption}</i>", styles['Normal']))
                return False
        else:
            story.append(Paragraph(f"<i>Image not available: {caption}</i>", styles['Normal']))
            return False
    
    # Add images side by side
    story.append(Paragraph("<b>Before Analysis (Historical Baseline)</b>", styles['Normal']))
    before_path = analysis_data.get('before_path') or analysis_data.get('image_before', '')
    if before_path and not os.path.isabs(before_path):
        # Try to construct full path
        before_path = os.path.join(os.getcwd(), 'ai_engine', 'data', 'inference', os.path.basename(before_path))
    add_image_if_exists(before_path, "Historical baseline image showing restored forest coverage")
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>After Analysis (Current Satellite View)</b>", styles['Normal']))
    after_path = analysis_data.get('after_path') or analysis_data.get('image_after', '')
    if after_path and not os.path.isabs(after_path):
        after_path = os.path.join(os.getcwd(), 'ai_engine', 'data', 'inference', os.path.basename(after_path))
    add_image_if_exists(after_path, "Current satellite imagery of the location")
    
    story.append(Spacer(1, 0.2*inch))
    story.append(Paragraph("<b>AI Detection Mask</b>", styles['Normal']))
    mask_path = analysis_data.get('mask_path') or analysis_data.get('mask', '')
    if mask_path and not os.path.isabs(mask_path):
        mask_path = os.path.join(os.getcwd(), 'ai_engine', 'output', os.path.basename(mask_path))
    add_image_if_exists(mask_path, "AI-generated segmentation mask highlighting forest areas")
    
    story.append(PageBreak())
    
    # Legal and Technical Details
    story.append(Paragraph("Technical Details", heading_style))
    
    technical_details = f"""
    <b>Analysis Methodology:</b><br/>
    This report was generated using deep learning-based semantic segmentation models trained on 
    satellite imagery. The model uses DeepLabV3+ architecture with ResNet50 encoder to identify 
    and segment forest cover from satellite images.<br/><br/>
    
    <b>Data Sources:</b><br/>
    - Satellite imagery processed through EcoWatch AI Engine<br/>
    - Geographic coordinates: {location_text}<br/>
    - Analysis timestamp: {report_date}<br/><br/>
    
    <b>Confidence Metrics:</b><br/>
    - Forest Coverage: {forest_coverage:.2f}%<br/>
    - Deforestation Level: {deforestation:.2f}%<br/>
    - Analysis Status: {'Critical' if deforestation > 60 else 'Moderate' if deforestation > 30 else 'Healthy'}<br/><br/>
    
    <b>Legal Disclaimer:</b><br/>
    This report is generated for informational purposes. The analysis is based on automated 
    AI processing and should be verified with ground truth data for legal proceedings. 
    EcoWatch is not liable for decisions made based on this automated analysis.
    """
    
    story.append(Paragraph(technical_details, styles['Normal']))
    
    # Build PDF
    doc.build(story)
    return output_path

