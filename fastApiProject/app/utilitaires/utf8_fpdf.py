from fpdf import FPDF

class FPDF_UTF8(FPDF):
    def _UTF8toUTF16(self, s):
        if isinstance(s, str):
            s = s.encode('utf-16-be')
        return s.decode('latin1')

    def cell(self, w, h=0, txt="", border=0, ln=0, align="", fill=0, link=""):
        txt = self._UTF8toUTF16(txt)
        super().cell(w, h, txt, border, ln, align, fill, link)

    def multi_cell(self, w, h, txt, border=0, align="", fill=0):
        txt = self._UTF8toUTF16(txt)
        super().multi_cell(w, h, txt, border, align, fill)

    def text(self, x, y, txt):
        txt = self._UTF8toUTF16(txt)
        super().text(x, y, txt)

    def write(self, h, txt, link=""):
        txt = self._UTF8toUTF16(txt)
        super().write(h, txt, link)